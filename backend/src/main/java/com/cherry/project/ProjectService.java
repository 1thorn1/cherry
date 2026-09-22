package com.cherry.project;

import com.cherry.common.InvalidNoteException;
import com.cherry.common.MilestoneNotFoundException;
import com.cherry.common.ProjectNotFoundException;
import com.cherry.park.ParkService;
import com.cherry.project.dto.FocusProjectResponse;
import com.cherry.project.dto.MilestoneResponse;
import com.cherry.project.dto.MilestoneTrackResponse;
import com.cherry.project.dto.NoteCreateRequest;
import com.cherry.project.dto.NoteResponse;
import com.cherry.project.dto.OtherProjectResponse;
import com.cherry.project.dto.ProjectCreateRequest;
import com.cherry.project.dto.ProjectDetailResponse;
import com.cherry.project.dto.ProjectLaneResponse;
import com.cherry.project.dto.ProjectOverviewResponse;
import com.cherry.project.dto.ProjectResponse;
import com.cherry.project.dto.ProjectSharedRequest;
import com.cherry.project.dto.TimelineEntryResponse;
import com.cherry.task.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.time.temporal.IsoFields;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final MilestoneRepository milestoneRepository;
    private final TaskRepository taskRepository;
    private final ProjectNoteRepository projectNoteRepository;
    private final ParkService parkService;

    @Transactional
    public ProjectResponse create(Long userId, ProjectCreateRequest request) {
        Project project = createProject(userId, request.name().trim(), request.type(),
                request.totalUnits(), request.examDate(), request.milestoneTitles());
        return ProjectResponse.from(project);
    }

    @Transactional
    public Project createProject(Long userId, String name, String type, Integer totalUnits,
                                  LocalDate examDate, List<String> milestoneTitles) {
        Project project = Project.create(userId, name, type, totalUnits, examDate);
        projectRepository.save(project);

        List<Milestone> milestones = switch (project.getType()) {
            case "PROGRESS" -> generateProgressMilestones(project);
            case "EXAM" -> generateExamMilestones(project);
            default -> generateFreeMilestones(project, milestoneTitles);
        };
        milestoneRepository.saveAll(milestones);

        return project;
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> list(Long userId) {
        return projectRepository.findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId)
                .stream().map(ProjectResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public ProjectOverviewResponse getOverview(Long userId) {
        List<Project> projects = projectRepository.findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId);

        LocalDate thisMonday = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        List<LocalDate> weeks = new ArrayList<>();
        for (int i = 0; i < 6; i++) {
            weeks.add(thisMonday.plusWeeks(i));
        }

        List<ProjectLaneResponse> lanes = projects.stream()
                .map(p -> new ProjectLaneResponse(
                        p.getId(), p.getName(), p.getColor(),
                        p.getCreatedAt().toLocalDate(),
                        "EXAM".equals(p.getType()) ? p.getExamDate() : null,
                        !"EXAM".equals(p.getType())
                ))
                .toList();

        Project focusProject = selectFocusProject(projects);
        FocusProjectResponse focus = focusProject == null ? null : buildFocus(focusProject);
        List<OtherProjectResponse> others = projects.stream()
                .filter(p -> focusProject == null || !p.getId().equals(focusProject.getId()))
                .map(this::buildOther)
                .toList();

        return new ProjectOverviewResponse(buildOverlapWarning(projects), weeks, lanes, focus, others);
    }

    private String buildOverlapWarning(List<Project> projects) {
        Map<String, List<Project>> byWeek = projects.stream()
                .filter(p -> "EXAM".equals(p.getType()) && p.getExamDate() != null)
                .collect(Collectors.groupingBy(p -> weekLabel(p.getExamDate())));

        return byWeek.entrySet().stream()
                .filter(e -> e.getValue().size() >= 2)
                .min(Comparator.comparing(e -> e.getValue().get(0).getExamDate()))
                .map(e -> String.format("%s에 %d개가 같이 끝나요. 하나를 당기거나 미루는 게 좋아요",
                        e.getKey(), e.getValue().size()))
                .orElse(null);
    }

    private String weekLabel(LocalDate date) {
        int weekOfMonth = (int) Math.ceil(date.getDayOfMonth() / 7.0);
        return date.getMonthValue() + "월 " + weekOfMonth + "주";
    }

    private Project selectFocusProject(List<Project> projects) {
        if (projects.isEmpty()) return null;

        LocalDateTime start = LocalDate.now().minusDays(6).atStartOfDay();
        LocalDateTime end = LocalDate.now().atTime(LocalTime.MAX);

        Project best = null;
        int bestCount = -1;
        for (Project p : projects) {
            int count = taskRepository
                    .findByProjectIdAndCompletedAtBetweenAndDeletedAtIsNull(p.getId(), start, end)
                    .size();
            if (count > bestCount) {
                bestCount = count;
                best = p;
            }
        }
        return best;
    }

    private FocusProjectResponse buildFocus(Project project) {
        List<Milestone> milestones = milestoneRepository.findByProjectIdOrderBySeqAsc(project.getId());
        List<MilestoneTrackResponse> track = milestones.stream()
                .map(m -> new MilestoneTrackResponse(m.getSeq(), m.getTitle(), m.getCompletedAt() != null))
                .toList();
        int cartIndex = (int) milestones.stream().filter(m -> m.getCompletedAt() != null).count();
        return new FocusProjectResponse(project.getId(), project.getName(), project.getType(), track, cartIndex);
    }

    private OtherProjectResponse buildOther(Project project) {
        List<Milestone> milestones = milestoneRepository.findByProjectIdOrderBySeqAsc(project.getId());
        int total = milestones.size();
        int completed = (int) milestones.stream().filter(m -> m.getCompletedAt() != null).count();
        String keyMetric = "EXAM".equals(project.getType()) && project.getExamDate() != null
                ? "D" + formatDday(project.getExamDate())
                : completed + "/" + total;
        return new OtherProjectResponse(project.getId(), project.getName(), project.getType(), project.getColor(),
                completed, total, keyMetric);
    }

    private String formatDday(LocalDate examDate) {
        long days = ChronoUnit.DAYS.between(LocalDate.now(), examDate);
        return days >= 0 ? "-" + days : "+" + Math.abs(days);
    }

    @Transactional(readOnly = true)
    public ProjectDetailResponse detail(Long userId, Long projectId) {
        Project project = findOwned(userId, projectId);
        List<MilestoneResponse> milestones = milestoneRepository
                .findByProjectIdOrderBySeqAsc(projectId)
                .stream().map(MilestoneResponse::from).toList();
        return new ProjectDetailResponse(ProjectResponse.from(project), milestones);
    }

    @Transactional(readOnly = true)
    public List<TimelineEntryResponse> timeline(Long userId, Long projectId) {
        findOwned(userId, projectId);

        Stream<TimelineEntryResponse> autoLogs = taskRepository
                .findByProjectIdAndCompletedAtIsNotNullAndDeletedAtIsNullOrderByCompletedAtDesc(projectId)
                .stream().map(TimelineEntryResponse::fromTask);

        Stream<TimelineEntryResponse> notes = projectNoteRepository
                .findByProjectIdAndDeletedAtIsNullOrderByCreatedAtDesc(projectId)
                .stream().map(TimelineEntryResponse::fromNote);

        return Stream.concat(autoLogs, notes)
                .sorted(Comparator.comparing(TimelineEntryResponse::at).reversed())
                .toList();
    }

    @Transactional
    public NoteResponse addNote(Long userId, Long projectId, NoteCreateRequest request) {
        Project project = findOwned(userId, projectId);
        validateNote(request);

        Long currentMilestoneId = milestoneRepository
                .findFirstByProjectIdAndCompletedAtIsNullOrderBySeqAsc(projectId)
                .map(Milestone::getId)
                .orElse(null);

        ProjectNote note = ProjectNote.create(userId, project.getId(), currentMilestoneId,
                request.kind(), request.body(), request.url());
        projectNoteRepository.save(note);
        return NoteResponse.from(note);
    }

    private void validateNote(NoteCreateRequest request) {
        switch (request.kind()) {
            case "LINK" -> {
                if (request.url() == null || request.url().isBlank()) {
                    throw new InvalidNoteException("링크는 URL을 입력해주세요");
                }
            }
            case "NOTE", "RETRO" -> {
                if (request.body() == null || request.body().isBlank()) {
                    throw new InvalidNoteException("내용을 입력해주세요");
                }
            }
            default -> throw new InvalidNoteException("알 수 없는 기록 종류입니다");
        }
    }

    @Transactional
    public ProjectResponse updateShared(Long userId, Long projectId, ProjectSharedRequest request) {
        Project project = findOwned(userId, projectId);
        project.updateShared(request.shared());
        return ProjectResponse.from(project);
    }

    @Transactional
    public MilestoneResponse completeMilestone(Long userId, Long milestoneId) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(MilestoneNotFoundException::new);
        findOwned(userId, milestone.getProjectId());
        boolean alreadyCompleted = milestone.getCompletedAt() != null;
        milestone.complete(LocalDateTime.now());
        if (!alreadyCompleted) {
            parkService.awardForMilestoneCompletion(userId, milestoneId);
        }
        return MilestoneResponse.from(milestone);
    }

    private List<Milestone> generateFreeMilestones(Project project, List<String> titles) {
        List<Milestone> milestones = new ArrayList<>();
        if (titles == null) return milestones;
        int seq = 1;
        for (String title : titles) {
            milestones.add(Milestone.create(project.getId(), seq++, title, null));
        }
        return milestones;
    }

    private List<Milestone> generateProgressMilestones(Project project) {
        List<Milestone> milestones = new ArrayList<>();
        int totalUnits = project.getTotalUnits();
        for (int n = 1; n <= totalUnits; n++) {
            milestones.add(Milestone.create(project.getId(), n, n + "강", null));
        }
        return milestones;
    }

    private List<Milestone> generateExamMilestones(Project project) {
        List<Milestone> milestones = new ArrayList<>();
        int totalUnits = project.getTotalUnits();

        LocalDate todayWeekStart = LocalDate.now().with(DayOfWeek.MONDAY);
        LocalDate examWeekStart = project.getExamDate().with(DayOfWeek.MONDAY);
        long weeksRemaining = Math.max(1, ChronoUnit.WEEKS.between(todayWeekStart, examWeekStart) + 1);
        int unitsPerWeek = (int) Math.ceil((double) totalUnits / weeksRemaining);

        int seq = 1;
        int unit = 1;
        LocalDate weekCursor = todayWeekStart;
        while (unit <= totalUnits) {
            int end = Math.min(unit + unitsPerWeek - 1, totalUnits);
            String title = (unit == end) ? unit + "단원" : unit + "~" + end + "단원";
            milestones.add(Milestone.create(project.getId(), seq, title, isoWeekString(weekCursor)));
            unit = end + 1;
            seq++;
            weekCursor = weekCursor.plusWeeks(1);
        }
        return milestones;
    }

    private String isoWeekString(LocalDate date) {
        int week = date.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR);
        int year = date.get(IsoFields.WEEK_BASED_YEAR);
        return String.format("%d-W%02d", year, week);
    }

    private Project findOwned(Long userId, Long projectId) {
        return projectRepository.findByIdAndUserIdAndDeletedAtIsNull(projectId, userId)
                .orElseThrow(ProjectNotFoundException::new);
    }
}

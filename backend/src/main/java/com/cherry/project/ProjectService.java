package com.cherry.project;

import com.cherry.common.InvalidNoteException;
import com.cherry.common.InvalidProjectException;
import com.cherry.common.MilestoneNotFoundException;
import com.cherry.common.NoteNotFoundException;
import com.cherry.common.ProjectNotFoundException;
import com.cherry.park.ParkService;
import com.cherry.project.dto.FocusProjectResponse;
import com.cherry.project.dto.MilestoneCreateRequest;
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
import com.cherry.project.dto.ProjectWorkDaysRequest;
import com.cherry.project.dto.NoteUpdateRequest;
import com.cherry.project.dto.TimelineEntryResponse;
import com.cherry.task.Task;
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
        validateTypeFields(type, totalUnits, examDate);
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

        List<Task> completedTasks = taskRepository
                .findByProjectIdAndCompletedAtIsNotNullAndDeletedAtIsNullOrderByCompletedAtDesc(projectId);

        // 반복 항목은 매일 완료 로그가 쌓여 타임라인을 오염시키므로 반복별로 접어서 한 줄로 보여준다
        // ("약 먹기 × 24", A-6-7/A-6-4 부작용 방어). 반복이 아닌 일반 완료는 그대로 개별 표시한다.
        Map<Long, List<Task>> byRoutine = completedTasks.stream()
                .filter(t -> t.getRoutineId() != null)
                .collect(Collectors.groupingBy(Task::getRoutineId));

        Stream<TimelineEntryResponse> routineLogs = byRoutine.values().stream()
                .map(tasks -> TimelineEntryResponse.fromRoutineGroup(
                        tasks.get(0).getRoutineId(),
                        tasks.get(0).getTitle(),
                        tasks.size(),
                        tasks.get(0).getMilestoneId(),
                        tasks.get(0).getCompletedAt()));

        Stream<TimelineEntryResponse> oneOffLogs = completedTasks.stream()
                .filter(t -> t.getRoutineId() == null)
                .map(TimelineEntryResponse::fromTask);

        Stream<TimelineEntryResponse> notes = projectNoteRepository
                .findByProjectIdAndDeletedAtIsNullOrderByCreatedAtDesc(projectId)
                .stream().map(TimelineEntryResponse::fromNote);

        return Stream.concat(Stream.concat(routineLogs, oneOffLogs), notes)
                .sorted(Comparator.comparing(TimelineEntryResponse::at).reversed())
                .toList();
    }

    @Transactional
    public NoteResponse addNote(Long userId, Long projectId, NoteCreateRequest request) {
        Project project = findOwned(userId, projectId);
        validateNote(request);

        Long milestoneId = request.milestoneId() != null
                ? resolveOwnedMilestone(project.getId(), request.milestoneId())
                : milestoneRepository
                        .findFirstByProjectIdAndCompletedAtIsNullOrderBySeqAsc(projectId)
                        .map(Milestone::getId)
                        .orElse(null);

        ProjectNote note = ProjectNote.create(userId, project.getId(), milestoneId,
                request.kind(), request.body(), request.url());
        projectNoteRepository.save(note);
        return NoteResponse.from(note);
    }

    // 마일스톤 칩을 눌러 기록을 남길 때는 "현재 진행 중인 마일스톤"이 아니라 사용자가 고른
    // 마일스톤에 정확히 붙여야 해서, 다른 프로젝트 마일스톤을 끌어오지 못하게 소유권을 확인한다.
    private Long resolveOwnedMilestone(Long projectId, Long milestoneId) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new InvalidNoteException("존재하지 않는 마일스톤입니다"));
        if (!milestone.getProjectId().equals(projectId)) {
            throw new InvalidNoteException("다른 프로젝트의 마일스톤입니다");
        }
        return milestone.getId();
    }

    private void validateNote(NoteCreateRequest request) {
        validateNoteContent(request.kind(), request.body(), request.url());
    }

    private void validateNoteContent(String kind, String body, String url) {
        switch (kind) {
            case "LINK" -> {
                if (url == null || url.isBlank()) {
                    throw new InvalidNoteException("링크는 URL을 입력해주세요");
                }
            }
            case "NOTE", "RETRO" -> {
                if (body == null || body.isBlank()) {
                    throw new InvalidNoteException("내용을 입력해주세요");
                }
            }
            default -> throw new InvalidNoteException("알 수 없는 기록 종류입니다");
        }
    }

    @Transactional
    public NoteResponse updateNote(Long userId, Long projectId, Long noteId, NoteUpdateRequest request) {
        ProjectNote note = findOwnedNote(userId, projectId, noteId);
        validateNoteContent(note.getKind(), request.body(), request.url());
        note.updateContent(request.body(), request.url());
        return NoteResponse.from(note);
    }

    @Transactional
    public void deleteNote(Long userId, Long projectId, Long noteId) {
        ProjectNote note = findOwnedNote(userId, projectId, noteId);
        note.delete();
    }

    private ProjectNote findOwnedNote(Long userId, Long projectId, Long noteId) {
        return projectNoteRepository.findByIdAndUserIdAndProjectIdAndDeletedAtIsNull(noteId, userId, projectId)
                .orElseThrow(NoteNotFoundException::new);
    }

    @Transactional
    public ProjectResponse updateShared(Long userId, Long projectId, ProjectSharedRequest request) {
        Project project = findOwned(userId, projectId);
        project.updateShared(request.shared());
        return ProjectResponse.from(project);
    }

    // 소프트 삭제만 한다. 마일스톤·태스크·기록은 그대로 둔다 — 완료 기록은 통계·공원 보상의
    // 근거라 프로젝트를 지웠다고 같이 사라지면 안 된다. 목록·개요 조회는 deletedAtIsNull로
    // 이미 걸러지므로 삭제된 프로젝트는 자연히 안 보인다.
    @Transactional
    public void deleteProject(Long userId, Long projectId) {
        Project project = findOwned(userId, projectId);
        project.delete();
    }

    @Transactional
    public ProjectResponse updateWorkDays(Long userId, Long projectId, ProjectWorkDaysRequest request) {
        Project project = findOwned(userId, projectId);
        project.updateWorkDays(request.workDays());
        return ProjectResponse.from(project);
    }

    // A-7: 자유형은 마일스톤을 손으로 만든다. 진도형·시험형은 생성 시 자동 생성되므로 임의 추가를 막는다.
    @Transactional
    public MilestoneResponse addMilestone(Long userId, Long projectId, MilestoneCreateRequest request) {
        Project project = findOwned(userId, projectId);
        if (!"FREE".equals(project.getType())) {
            throw new InvalidProjectException("자유형 프로젝트에만 마일스톤을 직접 추가할 수 있습니다");
        }
        List<Milestone> existing = milestoneRepository.findByProjectIdOrderBySeqAsc(projectId);
        int nextSeq = existing.isEmpty() ? 1 : existing.get(existing.size() - 1).getSeq() + 1;
        Milestone milestone = Milestone.create(projectId, nextSeq, request.title().trim(), null);
        milestoneRepository.save(milestone);
        return MilestoneResponse.from(milestone);
    }

    // 회차별·시험형은 "1강"/"1단원"처럼 제목이 자동 생성되는데, 실제로 그 회차에서 뭘
    // 다루는지 적을 자유가 없었다. 자유형 추가와 달리 타입 제한 없이 전부 이름을 바꿀 수
    // 있게 한다 — "1강 - 미분 기초"처럼 이어 쓰면 된다.
    @Transactional
    public MilestoneResponse renameMilestone(Long userId, Long projectId, Long milestoneId, MilestoneCreateRequest request) {
        findOwned(userId, projectId);
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(MilestoneNotFoundException::new);
        if (!milestone.getProjectId().equals(projectId)) {
            throw new InvalidProjectException("다른 프로젝트의 마일스톤입니다");
        }
        milestone.updateTitle(request.title().trim());
        return MilestoneResponse.from(milestone);
    }

    // B-11 (2026-09-22): total_units 없이 EXAM/PROGRESS 프로젝트를 만들면 마일스톤 생성 시 NPE로 500이 나던 버그.
    // 타입별 필수값을 요청 단계에서 막는다.
    private void validateTypeFields(String type, Integer totalUnits, LocalDate examDate) {
        if ("PROGRESS".equals(type) && (totalUnits == null || totalUnits <= 0)) {
            throw new InvalidProjectException("총 회차 수를 입력해주세요");
        }
        if ("EXAM".equals(type)) {
            if (totalUnits == null || totalUnits <= 0) {
                throw new InvalidProjectException("단원 수를 입력해주세요");
            }
            if (examDate == null) {
                throw new InvalidProjectException("시험일을 입력해주세요");
            }
        }
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

package com.cherry.project;

import com.cherry.common.MilestoneNotFoundException;
import com.cherry.common.ProjectNotFoundException;
import com.cherry.project.dto.MilestoneResponse;
import com.cherry.project.dto.ProjectCreateRequest;
import com.cherry.project.dto.ProjectDetailResponse;
import com.cherry.project.dto.ProjectResponse;
import com.cherry.project.dto.TimelineEntryResponse;
import com.cherry.task.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.time.temporal.IsoFields;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final MilestoneRepository milestoneRepository;
    private final TaskRepository taskRepository;

    @Transactional
    public ProjectResponse create(Long userId, ProjectCreateRequest request) {
        Project project = Project.create(userId, request.name().trim(), request.type(),
                request.totalUnits(), request.examDate());
        projectRepository.save(project);

        List<Milestone> milestones = switch (project.getType()) {
            case "PROGRESS" -> generateProgressMilestones(project);
            case "EXAM" -> generateExamMilestones(project);
            default -> generateFreeMilestones(project, request.milestoneTitles());
        };
        milestoneRepository.saveAll(milestones);

        return ProjectResponse.from(project);
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> list(Long userId) {
        return projectRepository.findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId)
                .stream().map(ProjectResponse::from).toList();
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
        return taskRepository
                .findByProjectIdAndCompletedAtIsNotNullAndDeletedAtIsNullOrderByCompletedAtDesc(projectId)
                .stream().map(TimelineEntryResponse::fromTask).toList();
    }

    @Transactional
    public MilestoneResponse completeMilestone(Long userId, Long milestoneId) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(MilestoneNotFoundException::new);
        findOwned(userId, milestone.getProjectId());
        milestone.complete(LocalDateTime.now());
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

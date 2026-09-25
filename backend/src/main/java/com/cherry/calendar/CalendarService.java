package com.cherry.calendar;

import com.cherry.calendar.dto.CalendarDayResponse;
import com.cherry.calendar.dto.MonthSummaryResponse;
import com.cherry.calendar.dto.RoutinePreviewResponse;
import com.cherry.project.Milestone;
import com.cherry.project.MilestoneRepository;
import com.cherry.project.Project;
import com.cherry.project.ProjectRepository;
import com.cherry.routine.Routine;
import com.cherry.routine.RoutineRepository;
import com.cherry.routine.RoutineService;
import com.cherry.task.Task;
import com.cherry.task.TaskRepository;
import com.cherry.task.dto.TaskResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CalendarService {

    private final TaskRepository taskRepository;
    private final RoutineRepository routineRepository;
    private final RoutineService routineService;
    private final ProjectRepository projectRepository;
    private final MilestoneRepository milestoneRepository;

    @Transactional
    public List<CalendarDayResponse> getWeek(Long userId, LocalDate start) {
        LocalDate end = start.plusDays(6);
        LocalDate today = LocalDate.now();

        if (!start.isAfter(today) && !end.isBefore(today)) {
            routineService.generateDueTasksForUser(userId, today);
        }

        List<Task> tasksInRange = taskRepository.findByUserIdAndTaskDateBetweenAndDeletedAtIsNull(userId, start, end);
        Map<LocalDate, List<Task>> tasksByDate = tasksInRange.stream()
                .collect(Collectors.groupingBy(Task::getTaskDate));
        // "실제" 탭은 예정된 날(taskDate)이 아니라 실제로 완료 처리한 날(COALESCE(effective_at,
        // completed_at)) 기준으로 보여준다 — 월간 요약(getMonth)도 같은 기준을 쓴다(A-6-8).
        // 이월된 태스크를 나중에 완료하면 taskDate와 완료일이 갈리는데, 여기를 taskDate로
        // 묶으면 "예정" 탭과는 맞지만 월간 완료 집계와는 다른 날짜에 표시돼 불일치로 보인다.
        Map<LocalDate, List<Task>> actualByDate = tasksInRange.stream()
                .filter(t -> t.getCompletedAt() != null)
                .collect(Collectors.groupingBy(this::effectiveDate));

        List<Routine> routines = routineRepository
                .findByUserIdAndPausedFalseAndDeletedAtIsNullOrderByCreatedAtAsc(userId);

        List<CalendarDayResponse> days = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            LocalDate date = start.plusDays(i);

            List<TaskResponse> tasks = tasksByDate.getOrDefault(date, List.of())
                    .stream().map(TaskResponse::from).toList();
            List<TaskResponse> actualTasks = actualByDate.getOrDefault(date, List.of())
                    .stream().map(TaskResponse::from).toList();

            List<RoutinePreviewResponse> previews = date.isAfter(today)
                    ? previewsFor(routines, date)
                    : List.of();

            days.add(new CalendarDayResponse(date, tasks, actualTasks, previews));
        }
        return days;
    }

    @Transactional
    public MonthSummaryResponse getMonth(Long userId, YearMonth month) {
        LocalDate start = month.atDay(1);
        LocalDate end = month.atEndOfMonth();

        Map<LocalDate, List<String>> titlesByDate = taskRepository
                .findByUserIdAndTaskDateBetweenAndDeletedAtIsNull(userId, start, end)
                .stream()
                .filter(t -> t.getCompletedAt() != null)
                .collect(Collectors.groupingBy(this::effectiveDate, Collectors.mapping(Task::getTitle, Collectors.toList())));

        List<MonthSummaryResponse.DailyCount> dailyCounts = new ArrayList<>();
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            List<String> titles = titlesByDate.getOrDefault(d, List.of());
            dailyCounts.add(new MonthSummaryResponse.DailyCount(d, titles.size(), titles));
        }

        List<MonthSummaryResponse.ProjectProgress> projects = projectRepository
                .findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId)
                .stream()
                .filter(p -> "ACTIVE".equals(p.getStatus()))
                .map(this::toProjectProgress)
                .filter(p -> p.totalMilestones() > 0)
                .toList();

        return new MonthSummaryResponse(month.toString(), dailyCounts, projects);
    }

    private LocalDate effectiveDate(Task task) {
        LocalDateTime anchor = task.getEffectiveAt() != null ? task.getEffectiveAt() : task.getCompletedAt();
        return anchor.toLocalDate();
    }

    private MonthSummaryResponse.ProjectProgress toProjectProgress(Project project) {
        List<Milestone> milestones = milestoneRepository.findByProjectIdOrderBySeqAsc(project.getId());
        int total = milestones.size();
        int completed = (int) milestones.stream().filter(m -> m.getCompletedAt() != null).count();
        return new MonthSummaryResponse.ProjectProgress(
                project.getId(), project.getName(), project.getColor(), project.getType(), completed, total);
    }

    private List<RoutinePreviewResponse> previewsFor(List<Routine> routines, LocalDate date) {
        List<RoutinePreviewResponse> previews = new ArrayList<>();
        for (Routine routine : routines) {
            if (!routine.matches(date)) continue;
            if (taskRepository.existsByRoutineIdAndTaskDate(routine.getId(), date)) continue;
            previews.add(new RoutinePreviewResponse(routine.getId(), routine.getTitle(), routine.getDefaultTime()));
        }
        return previews;
    }
}

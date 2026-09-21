package com.cherry.calendar;

import com.cherry.calendar.dto.CalendarDayResponse;
import com.cherry.calendar.dto.RoutinePreviewResponse;
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

    @Transactional
    public List<CalendarDayResponse> getWeek(Long userId, LocalDate start) {
        LocalDate end = start.plusDays(6);
        LocalDate today = LocalDate.now();

        if (!start.isAfter(today) && !end.isBefore(today)) {
            routineService.generateDueTasksForUser(userId, today);
        }

        Map<LocalDate, List<Task>> tasksByDate = taskRepository
                .findByUserIdAndTaskDateBetweenAndDeletedAtIsNull(userId, start, end)
                .stream().collect(Collectors.groupingBy(Task::getTaskDate));

        List<Routine> routines = routineRepository
                .findByUserIdAndPausedFalseAndDeletedAtIsNullOrderByCreatedAtAsc(userId);

        List<CalendarDayResponse> days = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            LocalDate date = start.plusDays(i);

            List<TaskResponse> tasks = tasksByDate.getOrDefault(date, List.of())
                    .stream().map(TaskResponse::from).toList();

            List<RoutinePreviewResponse> previews = date.isAfter(today)
                    ? previewsFor(routines, date)
                    : List.of();

            days.add(new CalendarDayResponse(date, tasks, previews));
        }
        return days;
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

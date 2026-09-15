package com.cherry.task;

import com.cherry.common.TaskNotFoundException;
import com.cherry.routine.RoutineService;
import com.cherry.task.dto.TaskCreateRequest;
import com.cherry.task.dto.TaskMemoRequest;
import com.cherry.task.dto.TaskResponse;
import com.cherry.task.dto.TodayResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.cherry.task.dto.TaskScheduleRequest;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final RoutineService routineService;

    @Transactional
    public TaskResponse create(Long userId, TaskCreateRequest request) {
        Task task = Task.create(userId, request.title().trim(), request.taskDate());
        return TaskResponse.from(taskRepository.save(task));
    }

    @Transactional
    public TodayResponse getToday(Long userId, LocalDate date) {
        if (date.equals(LocalDate.now())) {
            routineService.generateDueTasksForUser(userId, date);
        }

        List<TaskResponse> todo = taskRepository
                .findByUserIdAndTaskDateAndCompletedAtIsNullAndDeletedAtIsNullOrderBySortOrderAsc(userId, date)
                .stream().map(TaskResponse::from).toList();

        List<TaskResponse> done = taskRepository
                .findByUserIdAndTaskDateAndCompletedAtIsNotNullAndDeletedAtIsNullOrderByCompletedAtDesc(userId, date)
                .stream().map(TaskResponse::from).toList();

        return new TodayResponse(date, todo, done);
    }

    @Transactional
    public TaskResponse complete(Long userId, Long taskId) {
        Task task = findOwned(userId, taskId);
        task.complete(LocalDateTime.now());
        return TaskResponse.from(task);
    }

    @Transactional
    public TaskResponse uncomplete(Long userId, Long taskId) {
        Task task = findOwned(userId, taskId);
        task.uncomplete();
        return TaskResponse.from(task);
    }

    @Transactional
    public TaskResponse changeMemo(Long userId, Long taskId, TaskMemoRequest request) {
        Task task = findOwned(userId, taskId);
        task.changeMemo(request.memo());
        return TaskResponse.from(task);
    }

    @Transactional
    public TaskResponse schedule(Long userId, Long taskId, TaskScheduleRequest request) {
        Task task = findOwned(userId, taskId);
        task.schedule(request.scheduledStart(), request.scheduledEnd());
        return TaskResponse.from(task);
    }

    @Transactional
    public void delete(Long userId, Long taskId) {
        Task task = findOwned(userId, taskId);
        task.softDelete(LocalDateTime.now());
    }

    private Task findOwned(Long userId, Long taskId) {
        return taskRepository.findByIdAndUserIdAndDeletedAtIsNull(taskId, userId)
                .orElseThrow(TaskNotFoundException::new);
    }
}

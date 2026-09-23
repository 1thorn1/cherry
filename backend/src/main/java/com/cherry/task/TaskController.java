package com.cherry.task;

import com.cherry.auth.CurrentUserId;
import com.cherry.task.dto.TaskCreateRequest;
import com.cherry.task.dto.TaskEffectiveTimeRequest;
import com.cherry.task.dto.TaskMemoRequest;
import com.cherry.task.dto.TaskPostponeRequest;
import com.cherry.task.dto.TaskProjectRequest;
import com.cherry.task.dto.TaskReminderRequest;
import com.cherry.task.dto.TaskResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.cherry.task.dto.TaskScheduleRequest;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    public ResponseEntity<TaskResponse> create(@CurrentUserId Long userId, @Valid @RequestBody TaskCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(taskService.create(userId, request));
    }

    @PatchMapping("/{id}/complete")
    public TaskResponse complete(@CurrentUserId Long userId, @PathVariable Long id) {
        return taskService.complete(userId, id);
    }

    @PatchMapping("/{id}/uncomplete")
    public TaskResponse uncomplete(@CurrentUserId Long userId, @PathVariable Long id) {
        return taskService.uncomplete(userId, id);
    }

    @PatchMapping("/{id}/effective-time")
    public TaskResponse setEffectiveTime(@CurrentUserId Long userId, @PathVariable Long id,
                                         @RequestBody TaskEffectiveTimeRequest request) {
        return taskService.setEffectiveTime(userId, id, request.effectiveAt());
    }

    @PatchMapping("/{id}/memo")
    public TaskResponse changeMemo(@CurrentUserId Long userId, @PathVariable Long id,
                                   @Valid @RequestBody TaskMemoRequest request) {
        return taskService.changeMemo(userId, id, request);
    }

    @PatchMapping("/{id}/postpone")
    public TaskResponse postpone(@CurrentUserId Long userId, @PathVariable Long id,
                                 @RequestBody TaskPostponeRequest request) {
        return taskService.postpone(userId, id, request.taskDate());
    }

    @PatchMapping("/{id}/schedule")
    public TaskResponse schedule(@CurrentUserId Long userId, @PathVariable Long id,
                                 @RequestBody TaskScheduleRequest request) {
        return taskService.schedule(userId, id, request);
    }

    @PatchMapping("/{id}/project")
    public TaskResponse assignProject(@CurrentUserId Long userId, @PathVariable Long id,
                                      @RequestBody TaskProjectRequest request) {
        return taskService.assignProject(userId, id, request);
    }

    @PatchMapping("/{id}/reminder")
    public TaskResponse setReminder(@CurrentUserId Long userId, @PathVariable Long id,
                                    @RequestBody TaskReminderRequest request) {
        return taskService.setReminder(userId, id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@CurrentUserId Long userId, @PathVariable Long id) {
        taskService.delete(userId, id);
        return ResponseEntity.noContent().build();
    }
}

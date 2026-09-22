package com.cherry.task;

import com.cherry.task.dto.TaskCreateRequest;
import com.cherry.task.dto.TaskEffectiveTimeRequest;
import com.cherry.task.dto.TaskMemoRequest;
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

    private static final Long DEV_USER_ID = 1L;

    private final TaskService taskService;

    @PostMapping
    public ResponseEntity<TaskResponse> create(@Valid @RequestBody TaskCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(taskService.create(DEV_USER_ID, request));
    }

    @PatchMapping("/{id}/complete")
    public TaskResponse complete(@PathVariable Long id) {
        return taskService.complete(DEV_USER_ID, id);
    }

    @PatchMapping("/{id}/uncomplete")
    public TaskResponse uncomplete(@PathVariable Long id) {
        return taskService.uncomplete(DEV_USER_ID, id);
    }

    @PatchMapping("/{id}/effective-time")
    public TaskResponse setEffectiveTime(@PathVariable Long id,
                                         @RequestBody TaskEffectiveTimeRequest request) {
        return taskService.setEffectiveTime(DEV_USER_ID, id, request.effectiveAt());
    }

    @PatchMapping("/{id}/memo")
    public TaskResponse changeMemo(@PathVariable Long id,
                                   @Valid @RequestBody TaskMemoRequest request) {
        return taskService.changeMemo(DEV_USER_ID, id, request);
    }

    @PatchMapping("/{id}/schedule")
    public TaskResponse schedule(@PathVariable Long id,
                                 @RequestBody TaskScheduleRequest request) {
        return taskService.schedule(DEV_USER_ID, id, request);
    }

    @PatchMapping("/{id}/project")
    public TaskResponse assignProject(@PathVariable Long id,
                                      @RequestBody TaskProjectRequest request) {
        return taskService.assignProject(DEV_USER_ID, id, request);
    }

    @PatchMapping("/{id}/reminder")
    public TaskResponse setReminder(@PathVariable Long id,
                                    @RequestBody TaskReminderRequest request) {
        return taskService.setReminder(DEV_USER_ID, id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        taskService.delete(DEV_USER_ID, id);
        return ResponseEntity.noContent().build();
    }
}

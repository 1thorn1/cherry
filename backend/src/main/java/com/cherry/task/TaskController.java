package com.cherry.task;

import com.cherry.task.dto.TaskCreateRequest;
import com.cherry.task.dto.TaskMemoRequest;
import com.cherry.task.dto.TaskResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    @PatchMapping("/{id}/memo")
    public TaskResponse changeMemo(@PathVariable Long id,
                                   @Valid @RequestBody TaskMemoRequest request) {
        return taskService.changeMemo(DEV_USER_ID, id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        taskService.delete(DEV_USER_ID, id);
        return ResponseEntity.noContent().build();
    }
}

package com.cherry.task;

import com.cherry.task.dto.TaskCreateRequest;
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
        TaskResponse response = taskService.create(DEV_USER_ID, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}

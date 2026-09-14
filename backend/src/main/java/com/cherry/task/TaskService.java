package com.cherry.task;

import com.cherry.task.dto.TaskCreateRequest;
import com.cherry.task.dto.TaskResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;

    @Transactional
    public TaskResponse create(Long userId, TaskCreateRequest request) {
        Task task = Task.create(userId, request.title().trim());
        Task saved = taskRepository.save(task);
        return TaskResponse.from(saved);
    }
}

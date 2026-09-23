package com.cherry.project;

import com.cherry.task.TaskService;
import com.cherry.task.dto.TaskResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/milestones")
@RequiredArgsConstructor
public class MilestoneController {

    private static final Long DEV_USER_ID = 1L;

    private final TaskService taskService;

    @PatchMapping("/{id}/complete")
    public TaskResponse complete(@PathVariable Long id) {
        return taskService.completeMilestoneNow(DEV_USER_ID, id);
    }
}

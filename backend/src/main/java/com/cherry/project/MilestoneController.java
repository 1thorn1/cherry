package com.cherry.project;

import com.cherry.auth.CurrentUserId;
import com.cherry.task.TaskService;
import com.cherry.task.dto.TaskResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/milestones")
@RequiredArgsConstructor
public class MilestoneController {

    private final TaskService taskService;

    @PatchMapping("/{id}/complete")
    public TaskResponse complete(@CurrentUserId Long userId, @PathVariable Long id) {
        return taskService.completeMilestoneNow(userId, id);
    }

    @PatchMapping("/{id}/uncomplete")
    public ResponseEntity<Void> uncomplete(@CurrentUserId Long userId, @PathVariable Long id) {
        taskService.uncompleteMilestoneNow(userId, id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/schedule-today")
    public TaskResponse scheduleToday(@CurrentUserId Long userId, @PathVariable Long id) {
        return taskService.scheduleMilestoneToday(userId, id);
    }

    @PatchMapping("/{id}/unschedule-today")
    public ResponseEntity<Void> unscheduleToday(@CurrentUserId Long userId, @PathVariable Long id) {
        taskService.unscheduleMilestoneToday(userId, id);
        return ResponseEntity.noContent().build();
    }
}

package com.cherry.task.dto;

import com.cherry.task.Task;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record TaskResponse(
        Long id,
        String title,
        String horizon,
        LocalDate taskDate,
        LocalDateTime scheduledStart,
        LocalDateTime scheduledEnd,
        LocalDateTime completedAt,
        LocalDateTime effectiveAt,
        Long projectId,
        Long milestoneId,
        String memo,
        int sortOrder
) {
    public static TaskResponse from(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getHorizon(),
                task.getTaskDate(),
                task.getScheduledStart(),
                task.getScheduledEnd(),
                task.getCompletedAt(),
                task.getEffectiveAt(),
                task.getProjectId(),
                task.getMilestoneId(),
                task.getMemo(),
                task.getSortOrder()
        );
    }
}

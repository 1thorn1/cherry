package com.cherry.project.dto;

import com.cherry.task.Task;

import java.time.LocalDateTime;

public record TimelineEntryResponse(
        String kind,
        Long taskId,
        String title,
        LocalDateTime completedAt
) {
    public static TimelineEntryResponse fromTask(Task task) {
        return new TimelineEntryResponse("AUTO_LOG", task.getId(), task.getTitle(), task.getCompletedAt());
    }
}

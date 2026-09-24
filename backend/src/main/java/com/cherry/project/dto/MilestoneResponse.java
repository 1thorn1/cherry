package com.cherry.project.dto;

import com.cherry.project.Milestone;

import java.time.LocalDateTime;

public record MilestoneResponse(
        Long id,
        int seq,
        String title,
        String targetWeek,
        boolean completed,
        LocalDateTime completedAt,
        boolean scheduledToday
) {
    public static MilestoneResponse from(Milestone milestone) {
        return from(milestone, false);
    }

    public static MilestoneResponse from(Milestone milestone, boolean scheduledToday) {
        return new MilestoneResponse(
                milestone.getId(),
                milestone.getSeq(),
                milestone.getTitle(),
                milestone.getTargetWeek(),
                milestone.getCompletedAt() != null,
                milestone.getCompletedAt(),
                scheduledToday
        );
    }
}

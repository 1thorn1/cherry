package com.cherry.project.dto;

import com.cherry.project.Milestone;

public record MilestoneResponse(
        Long id,
        int seq,
        String title,
        String targetWeek,
        boolean completed
) {
    public static MilestoneResponse from(Milestone milestone) {
        return new MilestoneResponse(
                milestone.getId(),
                milestone.getSeq(),
                milestone.getTitle(),
                milestone.getTargetWeek(),
                milestone.getCompletedAt() != null
        );
    }
}

package com.cherry.project.dto;

public record OtherProjectResponse(
        Long projectId,
        String name,
        String type,
        String color,
        int completedMilestones,
        int totalMilestones,
        String keyMetric
) {
}

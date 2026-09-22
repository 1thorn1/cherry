package com.cherry.project.dto;

public record MilestoneTrackResponse(
        int seq,
        String title,
        boolean completed
) {
}

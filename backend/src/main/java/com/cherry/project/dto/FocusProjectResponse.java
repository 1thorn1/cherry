package com.cherry.project.dto;

import java.util.List;

public record FocusProjectResponse(
        Long projectId,
        String name,
        String type,
        List<MilestoneTrackResponse> milestones,
        int cartIndex
) {
}

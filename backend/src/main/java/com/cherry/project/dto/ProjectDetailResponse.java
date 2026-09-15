package com.cherry.project.dto;

import java.util.List;

public record ProjectDetailResponse(
        ProjectResponse project,
        List<MilestoneResponse> milestones
) {
}

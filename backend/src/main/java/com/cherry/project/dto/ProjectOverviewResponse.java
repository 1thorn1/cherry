package com.cherry.project.dto;

import java.util.List;

public record ProjectOverviewResponse(
        String overlapWarning,
        List<OtherProjectResponse> others
) {
}

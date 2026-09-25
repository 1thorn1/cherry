package com.cherry.project.dto;

import java.time.LocalDate;
import java.util.List;

public record ProjectOverviewResponse(
        String overlapWarning,
        List<LocalDate> weeks,
        List<ProjectLaneResponse> lanes,
        List<OtherProjectResponse> others
) {
}

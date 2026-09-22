package com.cherry.project.dto;

import java.time.LocalDate;

public record ProjectLaneResponse(
        Long projectId,
        String name,
        String color,
        LocalDate startDate,
        LocalDate endDate,
        boolean openEnded
) {
}

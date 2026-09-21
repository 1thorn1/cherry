package com.cherry.calendar.dto;

import java.time.LocalDate;
import java.util.List;

public record MonthSummaryResponse(
        String month,
        List<DailyCount> dailyCounts,
        List<ProjectProgress> projects
) {
    public record DailyCount(LocalDate date, int count, List<String> titles) {
    }

    public record ProjectProgress(
            Long projectId, String name, String color, String type,
            int completedMilestones, int totalMilestones
    ) {
    }
}

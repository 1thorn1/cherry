package com.cherry.calendar.dto;

import java.time.LocalTime;

public record RoutinePreviewResponse(
        Long routineId,
        String title,
        LocalTime defaultTime
) {
}

package com.cherry.task.dto;

import java.time.LocalDateTime;

public record TaskScheduleRequest(
        LocalDateTime scheduledStart,
        LocalDateTime scheduledEnd
) {
}

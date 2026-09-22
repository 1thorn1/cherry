package com.cherry.parse.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record TaskParseResponse(
        LocalDate taskDate,
        LocalTime scheduledTime
) {
}

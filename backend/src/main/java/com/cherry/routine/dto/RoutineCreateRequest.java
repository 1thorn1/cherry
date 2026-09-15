package com.cherry.routine.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record RoutineCreateRequest(
        @NotBlank(message = "제목을 입력해주세요") String title,
        @NotBlank(message = "반복 규칙을 선택해주세요") String freq,
        Byte weekdays,
        Byte monthDay,
        LocalTime defaultTime,
        String timeBasis,
        @NotNull(message = "시작일을 입력해주세요") LocalDate startedOn
) {
}

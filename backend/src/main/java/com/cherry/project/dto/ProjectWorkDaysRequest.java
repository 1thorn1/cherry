package com.cherry.project.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record ProjectWorkDaysRequest(
        @NotEmpty(message = "최소 하루는 작업 요일로 선택해야 합니다")
        List<@Min(1) @Max(7) Integer> workDays
) {
}

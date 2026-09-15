package com.cherry.project.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.util.List;

public record ProjectCreateRequest(
        @NotBlank(message = "프로젝트 이름을 입력해주세요") String name,
        String type,
        Integer totalUnits,
        LocalDate examDate,
        List<String> milestoneTitles
) {
}

package com.cherry.challenge.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.util.List;

public record ChallengeCreateRequest(
        @NotBlank(message = "방 이름을 입력해주세요") String title,
        String type,
        Integer totalUnits,
        LocalDate targetDate,
        List<String> milestoneTitles
) {
}

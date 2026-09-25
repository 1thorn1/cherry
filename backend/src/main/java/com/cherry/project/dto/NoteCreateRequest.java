package com.cherry.project.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record NoteCreateRequest(
        @NotBlank(message = "기록 종류를 선택해주세요") String kind,
        String body,
        String url,
        Long milestoneId,
        LocalDate noteDate
) {
}

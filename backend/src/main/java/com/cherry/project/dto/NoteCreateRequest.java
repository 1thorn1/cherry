package com.cherry.project.dto;

import jakarta.validation.constraints.NotBlank;

public record NoteCreateRequest(
        @NotBlank(message = "기록 종류를 선택해주세요") String kind,
        String body,
        String url,
        Long milestoneId
) {
}

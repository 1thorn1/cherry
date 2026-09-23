package com.cherry.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MilestoneCreateRequest(
        @NotBlank(message = "마일스톤 제목을 입력해주세요")
        @Size(max = 100, message = "제목은 100자를 넘을 수 없습니다")
        String title
) {
}

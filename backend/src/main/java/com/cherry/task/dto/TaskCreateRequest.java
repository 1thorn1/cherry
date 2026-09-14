package com.cherry.task.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TaskCreateRequest(
        @NotBlank(message = "제목을 입력해주세요")
        @Size(max = 255, message = "제목은 255자를 넘을 수 없습니다")
        String title
) {
}

package com.cherry.task.dto;

import jakarta.validation.constraints.Size;

public record TaskMemoRequest(
        @Size(max = 500, message = "메모는 500자를 넘을 수 없습니다")
        String memo
) {
}

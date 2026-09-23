package com.cherry.challenge.dto;

import jakarta.validation.constraints.Size;

public record ChallengeMemoRequest(
        @Size(max = 200, message = "메모는 200자를 넘을 수 없습니다")
        String memo
) {
}

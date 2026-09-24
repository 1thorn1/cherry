package com.cherry.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NicknameUpdateRequest(
        @NotBlank(message = "닉네임을 입력해주세요")
        @Size(max = 50, message = "닉네임은 50자를 넘을 수 없습니다")
        String nickname
) {
}

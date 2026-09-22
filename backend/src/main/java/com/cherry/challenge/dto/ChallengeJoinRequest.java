package com.cherry.challenge.dto;

import jakarta.validation.constraints.NotBlank;

public record ChallengeJoinRequest(
        @NotBlank(message = "초대 코드를 입력해주세요") String inviteCode
) {
}

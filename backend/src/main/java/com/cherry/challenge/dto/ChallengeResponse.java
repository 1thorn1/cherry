package com.cherry.challenge.dto;

import com.cherry.challenge.Challenge;

import java.time.LocalDate;

public record ChallengeResponse(
        Long id,
        String title,
        String type,
        Integer totalUnits,
        LocalDate targetDate,
        String inviteCode
) {
    public static ChallengeResponse from(Challenge challenge) {
        return new ChallengeResponse(
                challenge.getId(),
                challenge.getTitle(),
                challenge.getType(),
                challenge.getTotalUnits(),
                challenge.getTargetDate(),
                challenge.getInviteCode()
        );
    }
}

package com.cherry.challenge.dto;

public record ChallengeProjectLinkResponse(
        Long projectId,
        Long challengeId,
        String challengeTitle
) {
}

package com.cherry.challenge.dto;

import java.util.List;

public record ChallengeDetailResponse(
        Long id,
        String title,
        String type,
        String inviteCode,
        List<MemberProgressResponse> members
) {
}

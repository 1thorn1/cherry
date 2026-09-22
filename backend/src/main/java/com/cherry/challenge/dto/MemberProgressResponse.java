package com.cherry.challenge.dto;

import java.util.List;

public record MemberProgressResponse(
        String nickname,
        int completedMilestones,
        int totalMilestones,
        List<Boolean> recentActiveDays,
        boolean paused,
        boolean me
) {
}

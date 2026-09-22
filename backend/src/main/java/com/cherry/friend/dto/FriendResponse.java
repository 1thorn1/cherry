package com.cherry.friend.dto;

import java.time.LocalDateTime;

public record FriendResponse(
        Long friendshipId,
        String nickname,
        LocalDateTime since,
        Integer todayActivityCount
) {
}

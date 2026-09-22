package com.cherry.friend.dto;

import java.time.LocalDateTime;

public record PendingRequestResponse(
        Long friendshipId,
        String requesterNickname,
        LocalDateTime requestedAt
) {
}

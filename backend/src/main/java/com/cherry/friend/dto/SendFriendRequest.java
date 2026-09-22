package com.cherry.friend.dto;

import jakarta.validation.constraints.NotBlank;

public record SendFriendRequest(
        @NotBlank(message = "친구 코드를 입력해주세요")
        String friendCode
) {
}

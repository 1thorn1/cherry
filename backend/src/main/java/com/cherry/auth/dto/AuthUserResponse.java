package com.cherry.auth.dto;

import com.cherry.user.User;

public record AuthUserResponse(
        Long id,
        String nickname,
        String email,
        String friendCode,
        String profileImageUrl
) {
    public static AuthUserResponse from(User user) {
        String imageUrl = user.getProfileImagePath() == null ? null : "/api/uploads/" + user.getProfileImagePath();
        return new AuthUserResponse(user.getId(), user.getNickname(), user.getEmail(), user.getFriendCode(), imageUrl);
    }
}

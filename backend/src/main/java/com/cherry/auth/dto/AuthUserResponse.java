package com.cherry.auth.dto;

public record AuthUserResponse(
        Long id,
        String nickname,
        String email,
        String friendCode
) {
}

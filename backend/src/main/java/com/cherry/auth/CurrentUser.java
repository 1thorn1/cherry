package com.cherry.auth;

import org.springframework.security.oauth2.core.user.OAuth2User;

public final class CurrentUser {

    private CurrentUser() {
    }

    public static Long idOrNull(OAuth2User principal) {
        if (principal == null) return null;
        Number id = principal.getAttribute(CherryOAuth2UserService.USER_ID_ATTRIBUTE);
        return id == null ? null : id.longValue();
    }
}

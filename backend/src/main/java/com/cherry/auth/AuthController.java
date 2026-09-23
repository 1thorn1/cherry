package com.cherry.auth;

import com.cherry.auth.dto.AuthUserResponse;
import com.cherry.user.User;
import com.cherry.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<AuthUserResponse> me(@AuthenticationPrincipal OAuth2User principal) {
        Long userId = CurrentUser.idOrNull(principal);
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userRepository.findById(userId).orElseThrow();
        return ResponseEntity.ok(AuthUserResponse.from(user));
    }
}

package com.cherry.auth;

import com.cherry.auth.dto.AuthUserResponse;
import com.cherry.user.User;
import com.cherry.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;

    @GetMapping("/me")
    public AuthUserResponse me(@CurrentUserId Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        return AuthUserResponse.from(user);
    }
}

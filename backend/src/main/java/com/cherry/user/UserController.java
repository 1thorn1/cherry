package com.cherry.user;

import com.cherry.auth.CurrentUserId;
import com.cherry.auth.dto.AuthUserResponse;
import com.cherry.user.dto.NicknameUpdateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PatchMapping
    public ResponseEntity<AuthUserResponse> updateNickname(@CurrentUserId Long userId,
                                                            @Valid @RequestBody NicknameUpdateRequest request) {
        return ResponseEntity.ok(AuthUserResponse.from(userService.updateNickname(userId, request.nickname())));
    }

    @PostMapping("/profile-image")
    public ResponseEntity<AuthUserResponse> updateProfileImage(@CurrentUserId Long userId,
                                                                @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(AuthUserResponse.from(userService.updateProfileImage(userId, file)));
    }
}

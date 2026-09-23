package com.cherry.user;

import com.cherry.auth.CurrentUser;
import com.cherry.auth.dto.AuthUserResponse;
import com.cherry.common.LoginRequiredException;
import com.cherry.user.dto.NicknameUpdateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

// 이 컨트롤러는 로그인을 전제로 한다 (프로필은 로그인한 사람 것이라 DEV_USER_ID로 대체할 수 없음).
// 나머지 API가 DEV_USER_ID를 걷어내기 전까지는 이 두 엔드포인트만 로그인을 강제로 요구한다.
@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PatchMapping
    public ResponseEntity<AuthUserResponse> updateNickname(@AuthenticationPrincipal OAuth2User principal,
                                                            @Valid @RequestBody NicknameUpdateRequest request) {
        Long userId = requireUserId(principal);
        return ResponseEntity.ok(AuthUserResponse.from(userService.updateNickname(userId, request.nickname())));
    }

    @PostMapping("/profile-image")
    public ResponseEntity<AuthUserResponse> updateProfileImage(@AuthenticationPrincipal OAuth2User principal,
                                                                @RequestParam("file") MultipartFile file) {
        Long userId = requireUserId(principal);
        return ResponseEntity.ok(AuthUserResponse.from(userService.updateProfileImage(userId, file)));
    }

    private Long requireUserId(OAuth2User principal) {
        Long userId = CurrentUser.idOrNull(principal);
        if (userId == null) {
            throw new LoginRequiredException();
        }
        return userId;
    }
}

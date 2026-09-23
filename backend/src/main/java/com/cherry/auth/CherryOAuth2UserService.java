package com.cherry.auth;

import com.cherry.user.User;
import com.cherry.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.HashMap;
import java.util.Map;

// 구글 로그인 성공 시 (provider, provider_uid)로 기존 유저를 찾고, 없으면 새로 만든다.
// friend_code 등 다른 곳에서 쓰던 무작위 코드 생성 패턴(ChallengeService의 초대 코드 생성)과 동일한 문자셋을 쓴다.
@Service
@RequiredArgsConstructor
public class CherryOAuth2UserService extends DefaultOAuth2UserService {

    private static final String FRIEND_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int FRIEND_CODE_LENGTH = 8;
    public static final String USER_ID_ATTRIBUTE = "cherry_user_id";

    private final UserRepository userRepository;
    private final SecureRandom random = new SecureRandom();

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest request) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(request);

        String provider = request.getClientRegistration().getRegistrationId().toUpperCase();
        String providerUid = oAuth2User.getName();
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        User user = userRepository.findByProviderAndProviderUid(provider, providerUid)
                .orElseGet(() -> userRepository.save(User.createFromOAuth(
                        provider, providerUid, email, name != null ? name : "사용자", generateUniqueFriendCode())));

        Map<String, Object> attributes = new HashMap<>(oAuth2User.getAttributes());
        attributes.put(USER_ID_ATTRIBUTE, user.getId());

        return new DefaultOAuth2User(oAuth2User.getAuthorities(), attributes, "sub");
    }

    private String generateUniqueFriendCode() {
        String code;
        do {
            StringBuilder sb = new StringBuilder(FRIEND_CODE_LENGTH);
            for (int i = 0; i < FRIEND_CODE_LENGTH; i++) {
                sb.append(FRIEND_CODE_CHARS.charAt(random.nextInt(FRIEND_CODE_CHARS.length())));
            }
            code = sb.toString();
        } while (userRepository.findByFriendCode(code).isPresent());
        return code;
    }
}

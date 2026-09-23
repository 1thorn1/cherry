package com.cherry.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

// 로그인 기반은 여기서 시작하지만, 기존 API는 아직 DEV_USER_ID를 하드코딩해서 쓰고 있어
// 로그인 여부와 무관하게 그대로 동작해야 한다. 그래서 지금은 전부 permitAll — 인증 강제는
// 컨트롤러들이 실제 로그인 사용자로 갈아탄 뒤(B-12 다음 단계)에 넣는다.
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private static final String FRONTEND_ORIGIN = "http://localhost:5173";

    private final CherryOAuth2UserService cherryOAuth2UserService;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(userInfo -> userInfo.userService(cherryOAuth2UserService))
                        .defaultSuccessUrl(FRONTEND_ORIGIN + "/settings", true)
                )
                .logout(logout -> logout
                        .logoutUrl("/api/auth/logout")
                        .logoutSuccessHandler((request, response, authentication) -> response.setStatus(204))
                );
        return http.build();
    }
}

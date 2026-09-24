package com.cherry.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

// Security 필터 체인 자체는 여전히 전부 permitAll — 실제 인증 강제는 각 컨트롤러
// 파라미터에 붙은 @CurrentUserId(CurrentUserIdArgumentResolver)가 로그인 안 됐을 때
// LoginRequiredException(401)을 던지는 것으로 대신한다. URL 패턴별로 막을 이유가
// 아직 없어서(정적 리소스·springdoc 등과 뒤섞여 있음) 이 방식이 더 단순하다.
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

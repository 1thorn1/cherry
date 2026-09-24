package com.cherry.auth;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.session.jdbc.config.annotation.web.http.EnableJdbcHttpSession;
import org.springframework.session.web.http.CookieHttpSessionIdResolver;
import org.springframework.session.web.http.DefaultCookieSerializer;
import org.springframework.session.web.http.HttpSessionIdResolver;

// spring-boot-autoconfigure 4.1.1에는 세션 자동설정이 아예 없다(jar 안
// META-INF/spring/...AutoConfiguration.imports에 session 관련 항목이 0개 — 직접 확인함).
// 그래서 application.yml의 spring.session.store-type: jdbc는 조용히 아무 효과가 없었고
// 여전히 인메모리 JSESSIONID를 쓰고 있었다(재시작마다 로그인이 풀린 진짜 원인).
// Boot 자동설정 없이 예전 방식대로 @EnableJdbcHttpSession으로 직접 켠다 — 이 필터는
// Boot가 "컨텍스트에 있는 모든 Filter 빈은 자동 등록한다"는 일반 규칙으로 붙는 것이라
// 세션 전용 자동설정이 없어도 동작한다.
@Configuration
@EnableJdbcHttpSession(maxInactiveIntervalInSeconds = SessionConfig.MAX_AGE_SECONDS)
public class SessionConfig {

    static final int MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

    // 기본 쿠키 직렬화기는 Max-Age를 안 넣는다(브라우저를 완전히 껐다 켜면 서버 세션은
    // 30일 살아있어도 쿠키 자체가 사라져 다시 로그인해야 함). 쿠키에도 같은 30일을 박아
    // 브라우저를 껐다 켜도 로그인이 유지되게 한다.
    @Bean
    public HttpSessionIdResolver httpSessionIdResolver() {
        DefaultCookieSerializer serializer = new DefaultCookieSerializer();
        serializer.setCookieMaxAge(MAX_AGE_SECONDS);
        CookieHttpSessionIdResolver resolver = new CookieHttpSessionIdResolver();
        resolver.setCookieSerializer(serializer);
        return resolver;
    }
}

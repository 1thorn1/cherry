package com.cherry.auth;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

// 컨트롤러 메서드 파라미터에 붙이면 로그인한 사용자의 내부 id(Long)를 그대로 받는다.
// 로그인 안 돼 있으면 LoginRequiredException(401)을 던진다 — DEV_USER_ID 하드코딩을 대체.
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.PARAMETER)
public @interface CurrentUserId {
}

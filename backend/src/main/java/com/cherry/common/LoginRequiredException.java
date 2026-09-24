package com.cherry.common;

public class LoginRequiredException extends RuntimeException {
    public LoginRequiredException() {
        super("로그인이 필요합니다");
    }
}

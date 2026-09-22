package com.cherry.common;

public class FriendCodeNotFoundException extends RuntimeException {
    public FriendCodeNotFoundException() {
        super("해당 친구 코드를 가진 사용자를 찾을 수 없습니다");
    }
}

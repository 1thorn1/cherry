package com.cherry.common;

public class FriendshipNotFoundException extends RuntimeException {
    public FriendshipNotFoundException() {
        super("해당 친구 요청을 찾을 수 없습니다");
    }
}

package com.cherry.common;

public class SelfFriendRequestException extends RuntimeException {
    public SelfFriendRequestException() {
        super("자기 자신에게는 친구 요청을 보낼 수 없습니다");
    }
}

package com.cherry.common;

public class DuplicateFriendRequestException extends RuntimeException {
    public DuplicateFriendRequestException() {
        super("이미 친구이거나 요청이 진행 중입니다");
    }
}

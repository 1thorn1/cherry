package com.cherry.common;

public class AlreadyChallengeMemberException extends RuntimeException {
    public AlreadyChallengeMemberException() {
        super("이미 참여 중인 챌린지입니다");
    }
}

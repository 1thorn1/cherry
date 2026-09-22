package com.cherry.common;

public class ChallengeNotFoundException extends RuntimeException {
    public ChallengeNotFoundException() {
        super("해당 챌린지를 찾을 수 없습니다");
    }
}

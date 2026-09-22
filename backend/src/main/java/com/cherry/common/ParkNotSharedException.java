package com.cherry.common;

public class ParkNotSharedException extends RuntimeException {
    public ParkNotSharedException() {
        super("이 사용자는 공원을 공개하지 않았습니다");
    }
}

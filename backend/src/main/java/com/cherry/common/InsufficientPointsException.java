package com.cherry.common;

public class InsufficientPointsException extends RuntimeException {
    public InsufficientPointsException() {
        super("체리가 부족합니다");
    }
}

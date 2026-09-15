package com.cherry.common;

public class RoutineNotFoundException extends RuntimeException {
    public RoutineNotFoundException() {
        super("해당 반복 일정을 찾을 수 없습니다");
    }
}

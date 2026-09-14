package com.cherry.common;

public class TaskNotFoundException extends RuntimeException {
    public TaskNotFoundException() {
        super("해당 태스크를 찾을 수 없습니다");
    }
}

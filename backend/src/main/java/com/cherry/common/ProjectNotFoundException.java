package com.cherry.common;

public class ProjectNotFoundException extends RuntimeException {
    public ProjectNotFoundException() {
        super("해당 프로젝트를 찾을 수 없습니다");
    }
}

package com.cherry.common;

public class MilestoneNotFoundException extends RuntimeException {
    public MilestoneNotFoundException() {
        super("해당 마일스톤을 찾을 수 없습니다");
    }
}

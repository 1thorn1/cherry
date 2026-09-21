package com.cherry.common;

public class CosmeticItemNotFoundException extends RuntimeException {
    public CosmeticItemNotFoundException() {
        super("해당 아이템을 찾을 수 없습니다");
    }
}

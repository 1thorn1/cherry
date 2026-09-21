package com.cherry.common;

public class ItemNotOwnedException extends RuntimeException {
    public ItemNotOwnedException() {
        super("아직 구매하지 않은 아이템입니다");
    }
}

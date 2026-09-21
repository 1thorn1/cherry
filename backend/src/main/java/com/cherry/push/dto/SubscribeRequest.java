package com.cherry.push.dto;

public record SubscribeRequest(
        String endpoint,
        Keys keys
) {
    public record Keys(String p256dh, String auth) {
    }
}

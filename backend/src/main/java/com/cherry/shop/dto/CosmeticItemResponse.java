package com.cherry.shop.dto;

import com.cherry.shop.CosmeticItem;

public record CosmeticItemResponse(
        Long id,
        String category,
        String code,
        String name,
        String value,
        int price,
        boolean owned,
        boolean equipped
) {
    public static CosmeticItemResponse from(CosmeticItem item, boolean owned, boolean equipped) {
        return new CosmeticItemResponse(
                item.getId(), item.getCategory(), item.getCode(), item.getName(),
                item.getValue(), item.getPrice(), owned, equipped
        );
    }
}

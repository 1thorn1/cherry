package com.cherry.shop;

import com.cherry.auth.CurrentUserId;
import com.cherry.shop.dto.CosmeticItemResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shop")
@RequiredArgsConstructor
public class ShopController {

    private final ShopService shopService;

    @GetMapping
    public List<CosmeticItemResponse> catalog(@CurrentUserId Long userId) {
        return shopService.catalog(userId);
    }

    @PostMapping("/{itemId}/purchase")
    public CosmeticItemResponse purchase(@CurrentUserId Long userId, @PathVariable Long itemId) {
        return shopService.purchase(userId, itemId);
    }

    @PatchMapping("/{itemId}/equip")
    public CosmeticItemResponse equip(@CurrentUserId Long userId, @PathVariable Long itemId) {
        return shopService.equip(userId, itemId);
    }
}

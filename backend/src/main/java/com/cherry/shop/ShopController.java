package com.cherry.shop;

import com.cherry.shop.dto.CosmeticItemResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shop")
@RequiredArgsConstructor
public class ShopController {

    private static final Long DEV_USER_ID = 1L;

    private final ShopService shopService;

    @GetMapping
    public List<CosmeticItemResponse> catalog() {
        return shopService.catalog(DEV_USER_ID);
    }

    @PostMapping("/{itemId}/purchase")
    public CosmeticItemResponse purchase(@PathVariable Long itemId) {
        return shopService.purchase(DEV_USER_ID, itemId);
    }

    @PatchMapping("/{itemId}/equip")
    public CosmeticItemResponse equip(@PathVariable Long itemId) {
        return shopService.equip(DEV_USER_ID, itemId);
    }
}

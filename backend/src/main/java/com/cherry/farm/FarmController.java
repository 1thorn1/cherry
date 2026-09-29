package com.cherry.farm;

import com.cherry.auth.CurrentUserId;
import com.cherry.farm.dto.FarmResponse;
import com.cherry.farm.dto.ProductionStartRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/farm")
@RequiredArgsConstructor
public class FarmController {

    private final FarmService farmService;

    @GetMapping
    public FarmResponse get(@CurrentUserId Long userId) {
        return farmService.getFarm(userId);
    }

    @PostMapping("/production")
    @ResponseStatus(HttpStatus.CREATED)
    public void startProduction(@CurrentUserId Long userId, @RequestBody ProductionStartRequest request) {
        farmService.startProduction(userId, request.recipeCode());
    }
}

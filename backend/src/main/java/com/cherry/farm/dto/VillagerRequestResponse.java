package com.cherry.farm.dto;

import java.time.LocalDateTime;

public record VillagerRequestResponse(
        Long id,
        String villagerName,
        String recipeCode,
        String recipeName,
        LocalDateTime createdAt
) {
}

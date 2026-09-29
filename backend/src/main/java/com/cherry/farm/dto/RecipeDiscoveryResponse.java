package com.cherry.farm.dto;

import com.cherry.farm.RecipeDiscovery;

import java.time.LocalDateTime;

public record RecipeDiscoveryResponse(
        String recipeCode,
        LocalDateTime firstMade,
        int totalCount
) {
    public static RecipeDiscoveryResponse from(RecipeDiscovery discovery) {
        return new RecipeDiscoveryResponse(
                discovery.getRecipeCode(), discovery.getFirstMade(), discovery.getTotalCount());
    }
}

package com.cherry.farm.dto;

import com.cherry.farm.Production;

import java.time.LocalDateTime;

public record ProductionResponse(
        Long id,
        String recipeCode,
        LocalDateTime startedAt,
        LocalDateTime doneAt
) {
    public static ProductionResponse from(Production production) {
        return new ProductionResponse(
                production.getId(), production.getRecipeCode(),
                production.getStartedAt(), production.getDoneAt());
    }
}

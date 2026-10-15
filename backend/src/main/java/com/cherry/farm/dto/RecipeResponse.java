package com.cherry.farm.dto;

import com.cherry.farm.Recipe;

import java.util.List;

public record RecipeResponse(
        String code,
        String name,
        String spriteKey,
        int minutes,
        int sellPrice,
        List<RecipeIngredientResponse> ingredients
) {
    public static RecipeResponse from(Recipe recipe, List<RecipeIngredientResponse> ingredients) {
        return new RecipeResponse(
                recipe.getCode(), recipe.getName(), recipe.getSpriteKey(),
                recipe.getMinutes(), recipe.getSellPrice(), ingredients);
    }
}

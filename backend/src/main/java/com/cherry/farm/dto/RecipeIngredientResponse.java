package com.cherry.farm.dto;

import com.cherry.farm.RecipeIngredient;

public record RecipeIngredientResponse(
        String itemCode,
        int amount
) {
    public static RecipeIngredientResponse from(RecipeIngredient ingredient) {
        return new RecipeIngredientResponse(ingredient.getItemCode(), ingredient.getAmount());
    }
}

package com.cherry.farm;

import java.io.Serializable;
import java.util.Objects;

public class RecipeIngredientId implements Serializable {

    private String recipeCode;
    private String itemCode;

    public RecipeIngredientId() {
    }

    public RecipeIngredientId(String recipeCode, String itemCode) {
        this.recipeCode = recipeCode;
        this.itemCode = itemCode;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof RecipeIngredientId that)) return false;
        return Objects.equals(recipeCode, that.recipeCode) && Objects.equals(itemCode, that.itemCode);
    }

    @Override
    public int hashCode() {
        return Objects.hash(recipeCode, itemCode);
    }
}

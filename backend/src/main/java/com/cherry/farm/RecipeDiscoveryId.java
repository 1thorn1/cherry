package com.cherry.farm;

import java.io.Serializable;
import java.util.Objects;

public class RecipeDiscoveryId implements Serializable {

    private Long userId;
    private String recipeCode;

    public RecipeDiscoveryId() {
    }

    public RecipeDiscoveryId(Long userId, String recipeCode) {
        this.userId = userId;
        this.recipeCode = recipeCode;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof RecipeDiscoveryId that)) return false;
        return Objects.equals(userId, that.userId) && Objects.equals(recipeCode, that.recipeCode);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, recipeCode);
    }
}

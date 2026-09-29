package com.cherry.farm;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "recipe_ingredient")
@IdClass(RecipeIngredientId.class)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RecipeIngredient {

    @Id
    @Column(name = "recipe_code", length = 50)
    private String recipeCode;

    @Id
    @Column(name = "item_code", length = 50)
    private String itemCode;

    @Column(nullable = false)
    private int amount;
}

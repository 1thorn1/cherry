package com.cherry.farm;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "villager")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Villager {

    @Id
    @Column(length = 50)
    private String code;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(name = "sprite_key", nullable = false, length = 100)
    private String spriteKey;

    @Column(name = "favorite_recipe_code", length = 50)
    private String favoriteRecipeCode;
}

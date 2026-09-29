package com.cherry.farm;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// 도감(스펙 7절) — "처음 만든 날"이 기록되는 회고 자료. 로직 없이 스키마만 먼저 둔다.
@Entity
@Table(name = "recipe_discovery")
@IdClass(RecipeDiscoveryId.class)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RecipeDiscovery {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Id
    @Column(name = "recipe_code", length = 50)
    private String recipeCode;

    @Column(name = "first_made", nullable = false)
    private LocalDateTime firstMade;

    @Column(name = "total_count", nullable = false)
    private int totalCount;

    public static RecipeDiscovery create(Long userId, String recipeCode, LocalDateTime firstMade) {
        RecipeDiscovery discovery = new RecipeDiscovery();
        discovery.userId = userId;
        discovery.recipeCode = recipeCode;
        discovery.firstMade = firstMade;
        discovery.totalCount = 1;
        return discovery;
    }

    public void increment() {
        this.totalCount++;
    }
}

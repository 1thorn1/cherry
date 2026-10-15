package com.cherry.farm;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "production")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Production {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "recipe_code", nullable = false, length = 50)
    private String recipeCode;

    @Column(insertable = false, updatable = false)
    private LocalDateTime startedAt;

    @Column(name = "done_at", nullable = false)
    private LocalDateTime doneAt;

    // 자동 수집이라 사실상 항상 true. 이력용으로만 둔다(스펙 11절).
    @Column(nullable = false)
    private boolean collected;

    public static Production start(Long userId, String recipeCode, LocalDateTime doneAt) {
        Production production = new Production();
        production.userId = userId;
        production.recipeCode = recipeCode;
        production.doneAt = doneAt;
        return production;
    }

    public void collect() {
        this.collected = true;
    }
}

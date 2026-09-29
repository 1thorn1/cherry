package com.cherry.farm;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "recipe")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Recipe {

    @Id
    @Column(length = 50)
    private String code;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(name = "sprite_key", nullable = false, length = 100)
    private String spriteKey;

    // 가공 소요 시간(분)
    @Column(nullable = false)
    private int minutes;

    @Column(name = "sell_price", nullable = false)
    private int sellPrice;

    @Column(name = "unlock_at", nullable = false)
    private int unlockAt;
}

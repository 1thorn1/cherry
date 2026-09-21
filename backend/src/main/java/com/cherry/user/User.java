package com.cherry.user;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "user")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    @Id
    private Long id;

    @Column(nullable = false, length = 50)
    private String nickname;

    @Column(name = "point_balance", nullable = false)
    private int pointBalance;

    @Column(nullable = false)
    private int population;

    public void earnPoints(int amount) {
        this.pointBalance += amount;
    }

    public void spendPoints(int amount) {
        this.pointBalance -= amount;
    }

    public void growPopulation(int amount) {
        this.population += amount;
    }
}

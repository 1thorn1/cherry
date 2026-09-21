package com.cherry.shop;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "cosmetic_item")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CosmeticItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String category;

    @Column(nullable = false, length = 50)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 100)
    private String value;

    @Column(nullable = false)
    private int price;

    @Column(insertable = false, updatable = false)
    private LocalDateTime createdAt;
}

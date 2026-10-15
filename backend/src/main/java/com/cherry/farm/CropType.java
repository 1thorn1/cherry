package com.cherry.farm;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "crop_type")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CropType {

    @Id
    @Column(length = 50)
    private String code;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false, length = 20)
    private String category;

    @Column(name = "sprite_key", nullable = false, length = 100)
    private String spriteKey;

    @Column(name = "tile_w", nullable = false)
    private byte tileW;

    @Column(name = "tile_h", nullable = false)
    private byte tileH;

    @Column(nullable = false)
    private int price;

    @Column(length = 20)
    private String season;
}

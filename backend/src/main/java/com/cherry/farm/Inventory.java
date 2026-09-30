package com.cherry.farm;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "inventory")
@IdClass(InventoryId.class)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Inventory {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Id
    @Column(name = "item_code", length = 50)
    private String itemCode;

    @Column(nullable = false)
    private int amount;

    public static Inventory create(Long userId, String itemCode) {
        Inventory inventory = new Inventory();
        inventory.userId = userId;
        inventory.itemCode = itemCode;
        return inventory;
    }

    public void add(int delta) {
        this.amount += delta;
    }
}

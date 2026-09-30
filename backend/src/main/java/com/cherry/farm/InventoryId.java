package com.cherry.farm;

import java.io.Serializable;
import java.util.Objects;

public class InventoryId implements Serializable {

    private Long userId;
    private String itemCode;

    public InventoryId() {
    }

    public InventoryId(Long userId, String itemCode) {
        this.userId = userId;
        this.itemCode = itemCode;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof InventoryId that)) return false;
        return Objects.equals(userId, that.userId) && Objects.equals(itemCode, that.itemCode);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, itemCode);
    }
}

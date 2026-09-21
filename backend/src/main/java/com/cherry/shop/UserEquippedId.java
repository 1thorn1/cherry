package com.cherry.shop;

import java.io.Serializable;
import java.util.Objects;

public class UserEquippedId implements Serializable {

    private Long userId;
    private String category;

    public UserEquippedId() {
    }

    public UserEquippedId(Long userId, String category) {
        this.userId = userId;
        this.category = category;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof UserEquippedId that)) return false;
        return Objects.equals(userId, that.userId) && Objects.equals(category, that.category);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, category);
    }
}

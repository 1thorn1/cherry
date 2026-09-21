package com.cherry.shop;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_equipped")
@IdClass(UserEquippedId.class)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserEquipped {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Id
    @Column(name = "category")
    private String category;

    @Column(name = "item_id", nullable = false)
    private Long itemId;

    @Column(insertable = false, updatable = false)
    private LocalDateTime equippedAt;

    public static UserEquipped create(Long userId, String category, Long itemId) {
        UserEquipped equipped = new UserEquipped();
        equipped.userId = userId;
        equipped.category = category;
        equipped.itemId = itemId;
        return equipped;
    }

    public void changeItem(Long itemId) {
        this.itemId = itemId;
    }
}

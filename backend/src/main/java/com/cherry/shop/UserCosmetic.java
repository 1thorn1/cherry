package com.cherry.shop;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_cosmetic")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserCosmetic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "item_id", nullable = false)
    private Long itemId;

    @Column(insertable = false, updatable = false)
    private LocalDateTime acquiredAt;

    public static UserCosmetic create(Long userId, Long itemId) {
        UserCosmetic owned = new UserCosmetic();
        owned.userId = userId;
        owned.itemId = itemId;
        return owned;
    }
}

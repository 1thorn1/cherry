package com.cherry.push;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "push_subscription")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PushSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 500)
    private String endpoint;

    @Column(nullable = false, length = 255)
    private String p256dh;

    @Column(nullable = false, length = 255)
    private String auth;

    @Column(name = "user_agent", length = 255)
    private String userAgent;

    @Column(insertable = false, updatable = false)
    private LocalDateTime createdAt;

    public static PushSubscription create(Long userId, String endpoint, String p256dh, String auth, String userAgent) {
        PushSubscription subscription = new PushSubscription();
        subscription.userId = userId;
        subscription.endpoint = endpoint;
        subscription.p256dh = p256dh;
        subscription.auth = auth;
        subscription.userAgent = userAgent;
        return subscription;
    }
}

package com.cherry.friend;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "friendship")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Friendship {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "requester_id", nullable = false)
    private Long requesterId;

    @Column(name = "addressee_id", nullable = false)
    private Long addresseeId;

    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @Column(insertable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime acceptedAt;

    public static Friendship request(Long requesterId, Long addresseeId) {
        Friendship friendship = new Friendship();
        friendship.requesterId = requesterId;
        friendship.addresseeId = addresseeId;
        return friendship;
    }

    public void accept(LocalDateTime now) {
        this.status = "ACCEPTED";
        this.acceptedAt = now;
    }

    public boolean involves(Long userId) {
        return requesterId.equals(userId) || addresseeId.equals(userId);
    }

    public Long partnerId(Long userId) {
        return requesterId.equals(userId) ? addresseeId : requesterId;
    }
}

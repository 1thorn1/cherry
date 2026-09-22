package com.cherry.challenge;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "challenge")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Challenge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, length = 20)
    private String type;

    private Integer totalUnits;

    private LocalDate targetDate;

    @Column(name = "invite_code", nullable = false, length = 8)
    private String inviteCode;

    @Column(insertable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime closedAt;

    public static Challenge create(Long ownerId, String title, String type,
                                    Integer totalUnits, LocalDate targetDate, String inviteCode) {
        Challenge challenge = new Challenge();
        challenge.ownerId = ownerId;
        challenge.title = title;
        challenge.type = type;
        challenge.totalUnits = totalUnits;
        challenge.targetDate = targetDate;
        challenge.inviteCode = inviteCode;
        return challenge;
    }
}

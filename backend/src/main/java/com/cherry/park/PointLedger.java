package com.cherry.park;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "point_ledger")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PointLedger {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "occurred_on", nullable = false)
    private LocalDate occurredOn;

    @Column(nullable = false)
    private int amount;

    @Column(nullable = false, length = 30)
    private String reason;

    @Column(name = "ref_type", nullable = false, length = 20)
    private String refType;

    @Column(name = "ref_id", nullable = false)
    private Long refId;

    @Column(insertable = false, updatable = false)
    private LocalDateTime createdAt;

    public static PointLedger create(Long userId, LocalDate occurredOn, int amount,
                                      String reason, String refType, Long refId) {
        PointLedger ledger = new PointLedger();
        ledger.userId = userId;
        ledger.occurredOn = occurredOn;
        ledger.amount = amount;
        ledger.reason = reason;
        ledger.refType = refType;
        ledger.refId = refId;
        return ledger;
    }
}

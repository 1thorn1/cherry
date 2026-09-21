package com.cherry.park;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "park_slot")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ParkSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "slot_index", nullable = false)
    private int slotIndex;

    @Column(name = "ride_code", nullable = false, length = 50)
    private String rideCode;

    @Column(name = "is_indoor", nullable = false)
    private boolean indoor;

    @Column(name = "milestone_id")
    private Long milestoneId;

    @Column(insertable = false, updatable = false)
    private LocalDateTime builtAt;

    public static ParkSlot create(Long userId, int slotIndex, String rideCode,
                                   boolean indoor, Long milestoneId) {
        ParkSlot slot = new ParkSlot();
        slot.userId = userId;
        slot.slotIndex = slotIndex;
        slot.rideCode = rideCode;
        slot.indoor = indoor;
        slot.milestoneId = milestoneId;
        return slot;
    }
}

package com.cherry.park.dto;

import com.cherry.park.ParkSlot;

public record ParkSlotResponse(
        Long id,
        int slotIndex,
        String rideCode,
        boolean indoor
) {
    public static ParkSlotResponse from(ParkSlot slot) {
        return new ParkSlotResponse(slot.getId(), slot.getSlotIndex(), slot.getRideCode(), slot.isIndoor());
    }
}

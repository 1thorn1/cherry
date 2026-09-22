package com.cherry.park.dto;

import java.util.List;

public record FriendParkResponse(
        int population,
        List<ParkSlotResponse> slots
) {
}

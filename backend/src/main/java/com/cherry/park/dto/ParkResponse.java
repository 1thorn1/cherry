package com.cherry.park.dto;

import java.util.List;

public record ParkResponse(
        int population,
        int pointBalance,
        int todayVisitors,
        int todayPointsEarned,
        List<ParkSlotResponse> slots
) {
}

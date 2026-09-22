package com.cherry.friend.dto;

public record SharingSettingsResponse(
        boolean sharePark,
        boolean shareActivityCount,
        boolean shareTaskTitles
) {
}

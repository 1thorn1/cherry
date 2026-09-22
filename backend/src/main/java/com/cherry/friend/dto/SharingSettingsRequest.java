package com.cherry.friend.dto;

public record SharingSettingsRequest(
        boolean sharePark,
        boolean shareActivityCount,
        boolean shareTaskTitles
) {
}

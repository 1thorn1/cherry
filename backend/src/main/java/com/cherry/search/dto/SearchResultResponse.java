package com.cherry.search.dto;

import java.time.LocalDateTime;

public record SearchResultResponse(
        String type,
        Long refId,
        String text,
        Long projectId,
        String projectName,
        LocalDateTime at
) {
}

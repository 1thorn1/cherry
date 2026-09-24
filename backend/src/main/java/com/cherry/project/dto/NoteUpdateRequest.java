package com.cherry.project.dto;

public record NoteUpdateRequest(
        String body,
        String url
) {
}

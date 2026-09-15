package com.cherry.project.dto;

import com.cherry.project.ProjectNote;

import java.time.LocalDateTime;

public record NoteResponse(
        Long id,
        String kind,
        String body,
        String url,
        Long milestoneId,
        LocalDateTime createdAt
) {
    public static NoteResponse from(ProjectNote note) {
        return new NoteResponse(
                note.getId(),
                note.getKind(),
                note.getBody(),
                note.getUrl(),
                note.getMilestoneId(),
                note.getCreatedAt()
        );
    }
}

package com.cherry.project.dto;

import com.cherry.project.ProjectNote;
import com.cherry.task.Task;

import java.time.LocalDateTime;

public record TimelineEntryResponse(
        String kind,
        Long refId,
        String title,
        String body,
        String url,
        LocalDateTime at
) {
    public static TimelineEntryResponse fromTask(Task task) {
        return new TimelineEntryResponse("AUTO_LOG", task.getId(), task.getTitle(), null, null, task.getCompletedAt());
    }

    public static TimelineEntryResponse fromNote(ProjectNote note) {
        return new TimelineEntryResponse(note.getKind(), note.getId(), null, note.getBody(), note.getUrl(), note.getCreatedAt());
    }
}

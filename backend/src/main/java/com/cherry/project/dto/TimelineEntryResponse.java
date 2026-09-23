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
        Integer count,
        Long milestoneId,
        LocalDateTime at
) {
    public static TimelineEntryResponse fromTask(Task task) {
        return new TimelineEntryResponse("AUTO_LOG", task.getId(), task.getTitle(), null, null, null,
                task.getMilestoneId(), task.getCompletedAt());
    }

    // 반복 항목은 매일 한 줄씩 쌓이면 타임라인이 오염되므로 접어서 한 줄로 보여준다 ("약 먹기 × 24", A-6-4 부작용 방어).
    public static TimelineEntryResponse fromRoutineGroup(Long routineId, String title, int count,
                                                          Long milestoneId, LocalDateTime latestAt) {
        return new TimelineEntryResponse("AUTO_LOG", routineId, title, null, null, count, milestoneId, latestAt);
    }

    public static TimelineEntryResponse fromNote(ProjectNote note) {
        return new TimelineEntryResponse(note.getKind(), note.getId(), null, note.getBody(), note.getUrl(), null,
                note.getMilestoneId(), note.getCreatedAt());
    }
}

package com.cherry.calendar.dto;

import com.cherry.task.dto.TaskResponse;

import java.time.LocalDate;
import java.util.List;

public record CalendarDayResponse(
        LocalDate date,
        List<TaskResponse> tasks,
        List<TaskResponse> actualTasks,
        List<RoutinePreviewResponse> previews
) {
}

package com.cherry.task.dto;

import java.time.LocalDate;
import java.util.List;

public record TodayResponse(
        LocalDate date,
        List<TaskResponse> todo,
        List<TaskResponse> done,
        List<TaskResponse> backlog
) {
}

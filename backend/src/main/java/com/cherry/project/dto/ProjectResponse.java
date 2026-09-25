package com.cherry.project.dto;

import com.cherry.project.Project;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record ProjectResponse(
        Long id,
        String name,
        String type,
        String color,
        Integer totalUnits,
        LocalDate examDate,
        String status,
        boolean shared,
        boolean starred,
        List<Integer> workDays,
        LocalDateTime createdAt
) {
    public static ProjectResponse from(Project project) {
        return new ProjectResponse(
                project.getId(),
                project.getName(),
                project.getType(),
                project.getColor(),
                project.getTotalUnits(),
                project.getExamDate(),
                project.getStatus(),
                project.isShared(),
                project.isStarred(),
                project.getWorkDaysList(),
                project.getCreatedAt()
        );
    }
}

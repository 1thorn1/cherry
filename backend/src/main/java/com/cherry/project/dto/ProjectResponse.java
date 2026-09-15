package com.cherry.project.dto;

import com.cherry.project.Project;

import java.time.LocalDate;

public record ProjectResponse(
        Long id,
        String name,
        String type,
        String color,
        Integer totalUnits,
        LocalDate examDate,
        String status
) {
    public static ProjectResponse from(Project project) {
        return new ProjectResponse(
                project.getId(),
                project.getName(),
                project.getType(),
                project.getColor(),
                project.getTotalUnits(),
                project.getExamDate(),
                project.getStatus()
        );
    }
}

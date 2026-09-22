package com.cherry.project;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "project")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 20)
    private String type = "FREE";

    @Column(nullable = false, length = 20)
    private String color = "BLUE";

    private Integer totalUnits;

    private LocalDate examDate;

    @Column(nullable = false)
    private byte workDays = 127;

    @Column(length = 8)
    private String deadlineWeek;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @Column(name = "is_shared", nullable = false)
    private boolean shared = false;

    private LocalDateTime archivedAt;

    private LocalDateTime deletedAt;

    @Column(insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    public static Project create(Long userId, String name, String type,
                                  Integer totalUnits, LocalDate examDate) {
        Project project = new Project();
        project.userId = userId;
        project.name = name;
        if (type != null) {
            project.type = type;
        }
        project.totalUnits = totalUnits;
        project.examDate = examDate;
        return project;
    }

    public void updateShared(boolean shared) {
        this.shared = shared;
    }
}

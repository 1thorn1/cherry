package com.cherry.project;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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

    public void delete() {
        this.deletedAt = LocalDateTime.now();
    }

    // work_days: 7비트, bit(n-1)이 ISO 요일 n(월=1~일=7)에 대응. 기본 127 = 매일 작업일.
    public List<Integer> getWorkDaysList() {
        List<Integer> days = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            if ((workDays & (1 << i)) != 0) days.add(i + 1);
        }
        return days;
    }

    public void updateWorkDays(List<Integer> isoDays) {
        byte mask = 0;
        for (int day : isoDays) {
            mask |= (byte) (1 << (day - 1));
        }
        this.workDays = mask;
    }

    public boolean isWorkDay(int isoDayOfWeek) {
        return (workDays & (1 << (isoDayOfWeek - 1))) != 0;
    }
}

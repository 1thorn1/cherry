package com.cherry.project;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "milestone")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Milestone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(nullable = false)
    private int seq;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(length = 8)
    private String targetWeek;

    private LocalDateTime startedAt;

    private LocalDateTime completedAt;

    @Column(insertable = false, updatable = false)
    private LocalDateTime createdAt;

    public static Milestone create(Long projectId, int seq, String title, String targetWeek) {
        Milestone milestone = new Milestone();
        milestone.projectId = projectId;
        milestone.seq = seq;
        milestone.title = title;
        milestone.targetWeek = targetWeek;
        return milestone;
    }

    public void complete(LocalDateTime now) {
        if (this.completedAt != null) return;
        this.completedAt = now;
    }
}

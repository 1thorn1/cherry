package com.cherry.project;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "project_note")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProjectNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "milestone_id")
    private Long milestoneId;

    // 시험일 프로젝트의 "N주차" 마일스톤처럼 한 마일스톤이 여러 날을 아우를 때, 이 기록이
    // 어느 날짜에 대한 것인지. 작성 시각(createdAt)과는 별개 — 나중에 몰아서 적어도 된다.
    @Column(name = "note_date")
    private LocalDate noteDate;

    @Column(nullable = false, length = 20)
    private String kind;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Column(length = 500)
    private String url;

    @Column(name = "file_key", length = 255)
    private String fileKey;

    private LocalDateTime deletedAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public static ProjectNote create(Long userId, Long projectId, Long milestoneId, LocalDate noteDate,
                                      String kind, String body, String url) {
        ProjectNote note = new ProjectNote();
        note.userId = userId;
        note.projectId = projectId;
        note.milestoneId = milestoneId;
        note.noteDate = noteDate;
        note.kind = kind;
        note.body = body;
        note.url = url;
        note.createdAt = LocalDateTime.now();
        return note;
    }

    public void updateContent(String body, String url) {
        this.body = body;
        this.url = url;
    }

    public void delete() {
        this.deletedAt = LocalDateTime.now();
    }
}

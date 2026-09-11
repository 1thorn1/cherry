package com.cherry.task;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "task")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, length = 20)
    private String horizon = "SOMEDAY";

    private LocalDate taskDate;

    private LocalDateTime scheduledStart;

    private LocalDateTime scheduledEnd;

    private LocalDateTime completedAt;

    private LocalDateTime effectiveAt;

    @Column(length = 500)
    private String memo;

    @Column(nullable = false)
    private int sortOrder = 0;

    private LocalDateTime deletedAt;

    @Column(insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    public static Task create(Long userId, String title) {
        Task task = new Task();
        task.userId = userId;
        task.title = title;
        return task;
    }

    public void complete(LocalDateTime now) {
        if (this.completedAt != null) return;
        this.completedAt = now;
        this.effectiveAt = now;
    }

    public void uncomplete() {
        this.completedAt = null;
        this.effectiveAt = null;
    }

    public void changeMemo(String memo) {
        this.memo = memo;
    }

    public void softDelete(LocalDateTime now) {
        this.deletedAt = now;
    }
}

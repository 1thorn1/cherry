package com.cherry.task;

import com.cherry.routine.Routine;
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

    @Column(name = "routine_id")
    private Long routineId;

    @Column(name = "project_id")
    private Long projectId;

    @Column(name = "milestone_id")
    private Long milestoneId;

    @Column(length = 500)
    private String memo;

    @Column(nullable = false)
    private int sortOrder = 0;

    private LocalDateTime deletedAt;

    @Column(insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    public static Task create(Long userId, String title, LocalDate taskDate) {
        Task task = new Task();
        task.userId = userId;
        task.title = title;
        task.taskDate = taskDate;
        if (taskDate != null) {
            task.horizon = "THIS_WEEK";
        }
        return task;
    }

    public static Task createFromRoutine(Routine routine, LocalDate taskDate) {
        Task task = new Task();
        task.userId = routine.getUserId();
        task.title = routine.getTitle();
        task.taskDate = taskDate;
        task.horizon = "THIS_WEEK";
        task.routineId = routine.getId();
        if (routine.getDefaultTime() != null) {
            task.scheduledStart = LocalDateTime.of(taskDate, routine.getDefaultTime());
        }
        return task;
    }

    public void complete(LocalDateTime now, Long currentMilestoneId) {
        if (this.completedAt != null) return;
        this.completedAt = now;
        this.effectiveAt = now;
        this.milestoneId = currentMilestoneId;
    }

    public void uncomplete() {
        this.completedAt = null;
        this.effectiveAt = null;
        this.milestoneId = null;
    }

    public void assignProject(Long projectId) {
        this.projectId = projectId;
    }

    public void changeMemo(String memo) {
        this.memo = memo;
    }

    public void softDelete(LocalDateTime now) {
        this.deletedAt = now;
    }

    public void schedule(LocalDateTime start, LocalDateTime end) {
        this.scheduledStart = start;
        this.scheduledEnd = end;
    }
}

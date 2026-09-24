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

    @Column(name = "notify_offset_min")
    private Integer notifyOffsetMin;

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
        return create(userId, title, taskDate, null, null);
    }

    public static Task create(Long userId, String title, LocalDate taskDate, Long projectId, Long milestoneId) {
        Task task = new Task();
        task.userId = userId;
        task.title = title;
        task.taskDate = taskDate;
        if (taskDate != null) {
            task.horizon = "THIS_WEEK";
        }
        task.projectId = projectId;
        task.milestoneId = milestoneId;
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

    public void complete(LocalDateTime now, LocalDateTime effectiveAt, Long currentMilestoneId) {
        if (this.completedAt != null) return;
        this.completedAt = now;
        this.effectiveAt = effectiveAt;
        this.milestoneId = currentMilestoneId;
    }

    // milestoneId를 남긴다. 마일스톤 칩을 다시 눌러 완료시킬 때
    // completeMilestoneNow()가 같은 태스크를 재사용하게 하려는 것 — 지우면 매번 새 태스크가
    // 생겨 미완료 상태로 오늘 화면에 쌓인다.
    public void reopen() {
        this.completedAt = null;
        this.effectiveAt = null;
    }

    public void changeEffectiveTime(LocalDateTime effectiveAt) {
        this.effectiveAt = effectiveAt;
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

    public void moveTo(LocalDate taskDate) {
        this.taskDate = taskDate;
    }

    // 미루기(A-11): 날짜만 바꾸고 예정 시각은 버린다 — 옮겨진 날의 그 시각이 그대로 유효하다는 보장이 없다.
    // taskDate가 null이면 "이번주로"(날짜 미지정, 이번 주 버킷)를 의미한다.
    public void postpone(LocalDate taskDate) {
        this.taskDate = taskDate;
        this.horizon = "THIS_WEEK";
        this.scheduledStart = null;
        this.scheduledEnd = null;
    }

    public void changeNotifyOffset(Integer notifyOffsetMin) {
        this.notifyOffsetMin = notifyOffsetMin;
    }
}

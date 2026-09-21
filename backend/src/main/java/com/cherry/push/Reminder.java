package com.cherry.push;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "reminder")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Reminder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "task_id", nullable = false)
    private Long taskId;

    @Column(name = "offset_min", nullable = false)
    private int offsetMin;

    @Column(name = "fire_at", nullable = false)
    private LocalDateTime fireAt;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    public static Reminder create(Long userId, Long taskId, int offsetMin, LocalDateTime fireAt) {
        Reminder reminder = new Reminder();
        reminder.userId = userId;
        reminder.taskId = taskId;
        reminder.offsetMin = offsetMin;
        reminder.fireAt = fireAt;
        return reminder;
    }

    public void markSent(LocalDateTime now) {
        this.sentAt = now;
    }
}

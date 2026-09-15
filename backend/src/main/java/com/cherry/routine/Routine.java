package com.cherry.routine;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "routine")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Routine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, length = 10)
    private String freq;

    private Byte weekdays;

    private Byte monthDay;

    private LocalTime defaultTime;

    @Column(nullable = false, length = 20)
    private String timeBasis = "CHECKED";

    @Column(nullable = false)
    private LocalDate startedOn;

    private LocalDate endedOn;

    @Column(nullable = false)
    private boolean paused = false;

    private LocalDateTime deletedAt;

    @Column(insertable = false, updatable = false)
    private LocalDateTime createdAt;

    public static Routine create(Long userId, String title, String freq, Byte weekdays,
                                  Byte monthDay, LocalTime defaultTime, String timeBasis,
                                  LocalDate startedOn) {
        Routine routine = new Routine();
        routine.userId = userId;
        routine.title = title;
        routine.freq = freq;
        routine.weekdays = weekdays;
        routine.monthDay = monthDay;
        routine.defaultTime = defaultTime;
        if (timeBasis != null) {
            routine.timeBasis = timeBasis;
        }
        routine.startedOn = startedOn;
        return routine;
    }

    public void pause() {
        this.paused = true;
    }

    public void resume() {
        this.paused = false;
    }

    public boolean matches(LocalDate date) {
        if (paused || deletedAt != null) return false;
        if (date.isBefore(startedOn)) return false;
        if (endedOn != null && date.isAfter(endedOn)) return false;

        return switch (freq) {
            case "DAILY" -> true;
            case "WEEKLY" -> matchesWeekday(date);
            case "MONTHLY" -> monthDay != null && date.getDayOfMonth() == monthDay;
            default -> false;
        };
    }

    private boolean matchesWeekday(LocalDate date) {
        if (weekdays == null) return false;
        int bit = 1 << (date.getDayOfWeek().getValue() - 1);
        return (weekdays & bit) != 0;
    }
}

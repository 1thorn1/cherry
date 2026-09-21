package com.cherry.park;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "daily_stat")
@IdClass(DailyStatId.class)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DailyStat {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Id
    @Column(name = "stat_date")
    private LocalDate statDate;

    @Column(name = "completed_count", nullable = false)
    private int completedCount;

    @Column(name = "weather_code")
    private String weatherCode;

    @Column(nullable = false)
    private BigDecimal multiplier = BigDecimal.ONE;

    @Column(nullable = false)
    private int visitors;

    @Column(name = "points_earned", nullable = false)
    private int pointsEarned;

    public static DailyStat create(Long userId, LocalDate statDate) {
        DailyStat stat = new DailyStat();
        stat.userId = userId;
        stat.statDate = statDate;
        return stat;
    }

    public void update(int completedCount, int visitors, int pointsEarned) {
        this.completedCount = completedCount;
        this.weatherCode = "CLEAR";
        this.multiplier = BigDecimal.ONE;
        this.visitors = visitors;
        this.pointsEarned = pointsEarned;
    }
}

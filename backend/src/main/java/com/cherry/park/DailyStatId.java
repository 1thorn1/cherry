package com.cherry.park;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.Objects;

public class DailyStatId implements Serializable {

    private Long userId;
    private LocalDate statDate;

    public DailyStatId() {
    }

    public DailyStatId(Long userId, LocalDate statDate) {
        this.userId = userId;
        this.statDate = statDate;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof DailyStatId that)) return false;
        return Objects.equals(userId, that.userId) && Objects.equals(statDate, that.statDate);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, statDate);
    }
}

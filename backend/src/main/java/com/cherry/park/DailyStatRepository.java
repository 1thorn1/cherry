package com.cherry.park;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface DailyStatRepository extends JpaRepository<DailyStat, DailyStatId> {

    Optional<DailyStat> findByUserIdAndStatDate(Long userId, LocalDate statDate);
}

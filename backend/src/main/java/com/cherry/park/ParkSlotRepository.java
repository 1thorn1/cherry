package com.cherry.park;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ParkSlotRepository extends JpaRepository<ParkSlot, Long> {

    List<ParkSlot> findByUserIdOrderBySlotIndexAsc(Long userId);

    int countByUserId(Long userId);
}

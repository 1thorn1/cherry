package com.cherry.park;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ParkSlotRepository extends JpaRepository<ParkSlot, Long> {

    List<ParkSlot> findByUserIdOrderBySlotIndexAsc(Long userId);

    Optional<ParkSlot> findTopByUserIdOrderBySlotIndexDesc(Long userId);
}

package com.cherry.park;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;

public interface ParkVisitRepository extends JpaRepository<ParkVisit, ParkVisitId> {

    boolean existsByVisitorIdAndHostIdAndVisitedOn(Long visitorId, Long hostId, LocalDate visitedOn);
}

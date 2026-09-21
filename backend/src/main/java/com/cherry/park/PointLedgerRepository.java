package com.cherry.park;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PointLedgerRepository extends JpaRepository<PointLedger, Long> {

    boolean existsByUserIdAndRefTypeAndRefId(Long userId, String refType, Long refId);
}

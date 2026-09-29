package com.cherry.farm;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VillagerRequestRepository extends JpaRepository<VillagerRequest, Long> {

    List<VillagerRequest> findByUserIdAndStatus(Long userId, String status);
}

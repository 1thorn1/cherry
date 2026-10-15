package com.cherry.farm;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductionRepository extends JpaRepository<Production, Long> {

    List<Production> findByUserIdAndCollectedFalse(Long userId);
}

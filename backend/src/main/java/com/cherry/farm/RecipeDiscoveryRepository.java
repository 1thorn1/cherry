package com.cherry.farm;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecipeDiscoveryRepository extends JpaRepository<RecipeDiscovery, RecipeDiscoveryId> {

    List<RecipeDiscovery> findByUserId(Long userId);
}

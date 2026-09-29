package com.cherry.farm;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InventoryRepository extends JpaRepository<Inventory, InventoryId> {

    List<Inventory> findByUserId(Long userId);

    Optional<Inventory> findByUserIdAndItemCode(Long userId, String itemCode);
}

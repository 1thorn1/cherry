package com.cherry.shop;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserCosmeticRepository extends JpaRepository<UserCosmetic, Long> {

    List<UserCosmetic> findByUserId(Long userId);

    boolean existsByUserIdAndItemId(Long userId, Long itemId);
}

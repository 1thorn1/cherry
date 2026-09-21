package com.cherry.shop;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserEquippedRepository extends JpaRepository<UserEquipped, UserEquippedId> {

    List<UserEquipped> findByUserId(Long userId);

    Optional<UserEquipped> findByUserIdAndCategory(Long userId, String category);
}

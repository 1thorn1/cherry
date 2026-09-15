package com.cherry.routine;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoutineRepository extends JpaRepository<Routine, Long> {

    List<Routine> findByUserIdAndPausedFalseAndDeletedAtIsNullOrderByCreatedAtAsc(Long userId);

    List<Routine> findByPausedFalseAndDeletedAtIsNull();

    Optional<Routine> findByIdAndUserIdAndDeletedAtIsNull(Long id, Long userId);
}

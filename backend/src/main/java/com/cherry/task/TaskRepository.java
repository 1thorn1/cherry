package com.cherry.task;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByUserIdAndTaskDateAndCompletedAtIsNullAndDeletedAtIsNullOrderBySortOrderAsc(
            Long userId, LocalDate taskDate);

    List<Task> findByUserIdAndTaskDateAndCompletedAtIsNotNullAndDeletedAtIsNullOrderByCompletedAtDesc(
            Long userId, LocalDate taskDate);

    Optional<Task> findByIdAndUserIdAndDeletedAtIsNull(Long id, Long userId);

    boolean existsByRoutineIdAndTaskDate(Long routineId, LocalDate taskDate);

    List<Task> findByProjectIdAndCompletedAtIsNotNullAndDeletedAtIsNullOrderByCompletedAtDesc(Long projectId);
}

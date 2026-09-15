package com.cherry.task;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    @Query("SELECT t FROM Task t WHERE t.userId = :userId AND t.deletedAt IS NULL " +
            "AND (t.title LIKE CONCAT('%', :keyword, '%') OR t.memo LIKE CONCAT('%', :keyword, '%')) " +
            "ORDER BY t.createdAt DESC")
    List<Task> search(@Param("userId") Long userId, @Param("keyword") String keyword);
}

package com.cherry.task;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
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

    Optional<Task> findFirstByMilestoneIdAndUserIdAndCompletedAtIsNullAndDeletedAtIsNull(Long milestoneId, Long userId);

    Optional<Task> findFirstByMilestoneIdAndUserIdAndCompletedAtIsNotNullAndDeletedAtIsNullOrderByCompletedAtDesc(
            Long milestoneId, Long userId);

    List<Task> findByProjectIdAndCompletedAtBetweenAndDeletedAtIsNull(
            Long projectId, LocalDateTime start, LocalDateTime end);

    List<Task> findByUserIdAndTaskDateBetweenAndDeletedAtIsNull(Long userId, LocalDate start, LocalDate end);

    // 반복 항목 누적 표기(A-6-1): 이번 달에 완료한 횟수. 끊긴 일수는 세지 않으므로 스트릭이 아니라 단순 카운트.
    long countByRoutineIdAndCompletedAtIsNotNullAndTaskDateBetween(Long routineId, LocalDate start, LocalDate end);

    @Query("SELECT t FROM Task t WHERE t.userId = :userId AND t.deletedAt IS NULL " +
            "AND (t.title LIKE CONCAT('%', :keyword, '%') OR t.memo LIKE CONCAT('%', :keyword, '%')) " +
            "ORDER BY t.createdAt DESC")
    List<Task> search(@Param("userId") Long userId, @Param("keyword") String keyword);

    // 미완료 이월 풀(A-11): 오늘 이전 날짜로 남은 미완료 항목 + "이번주로" 미룬 날짜 미지정 항목.
    @Query("SELECT t FROM Task t WHERE t.userId = :userId AND t.deletedAt IS NULL AND t.completedAt IS NULL " +
            "AND ((t.taskDate IS NOT NULL AND t.taskDate < :today) OR (t.taskDate IS NULL AND t.horizon = 'THIS_WEEK')) " +
            "ORDER BY CASE WHEN t.taskDate IS NULL THEN 1 ELSE 0 END, t.taskDate ASC")
    List<Task> findBacklog(@Param("userId") Long userId, @Param("today") LocalDate today);
}

package com.cherry.project;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProjectNoteRepository extends JpaRepository<ProjectNote, Long> {

    List<ProjectNote> findByProjectIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long projectId);

    @Query("SELECT n FROM ProjectNote n WHERE n.userId = :userId AND n.deletedAt IS NULL " +
            "AND (n.body LIKE CONCAT('%', :keyword, '%') OR n.url LIKE CONCAT('%', :keyword, '%')) " +
            "ORDER BY n.createdAt DESC")
    List<ProjectNote> search(@Param("userId") Long userId, @Param("keyword") String keyword);

    // 검색어가 비어 있을 때 최근 기록으로 대신 보여주기 위함 (A-6-5).
    List<ProjectNote> findTop20ByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long userId);
}

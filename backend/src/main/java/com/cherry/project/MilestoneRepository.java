package com.cherry.project;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MilestoneRepository extends JpaRepository<Milestone, Long> {

    List<Milestone> findByProjectIdOrderBySeqAsc(Long projectId);

    Optional<Milestone> findByIdAndProjectId(Long id, Long projectId);

    Optional<Milestone> findFirstByProjectIdAndCompletedAtIsNullOrderBySeqAsc(Long projectId);
}

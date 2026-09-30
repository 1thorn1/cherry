package com.cherry.farm;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FarmPlotRepository extends JpaRepository<FarmPlot, Long> {

    List<FarmPlot> findByUserId(Long userId);

    Optional<FarmPlot> findByUserIdAndProjectId(Long userId, Long projectId);

    Optional<FarmPlot> findByUserIdAndGridXAndGridY(Long userId, byte gridX, byte gridY);

    Optional<FarmPlot> findByIdAndUserId(Long id, Long userId);
}

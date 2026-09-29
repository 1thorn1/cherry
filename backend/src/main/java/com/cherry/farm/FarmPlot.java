package com.cherry.farm;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "farm_plot")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class FarmPlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "crop_code", nullable = false, length = 50)
    private String cropCode;

    // 프로젝트와 연결된 밭(스펙 3절 "프로젝트가 밭 한 구획"). NULL이면 자유 배치.
    @Column(name = "project_id")
    private Long projectId;

    @Column(name = "grid_x", nullable = false)
    private byte gridX;

    @Column(name = "grid_y", nullable = false)
    private byte gridY;

    @Column(nullable = false)
    private byte rotation;

    @Column(insertable = false, updatable = false)
    private LocalDateTime plantedAt;

    public static FarmPlot create(Long userId, String cropCode, Long projectId, byte gridX, byte gridY) {
        FarmPlot plot = new FarmPlot();
        plot.userId = userId;
        plot.cropCode = cropCode;
        plot.projectId = projectId;
        plot.gridX = gridX;
        plot.gridY = gridY;
        return plot;
    }

    public void move(byte gridX, byte gridY, byte rotation) {
        this.gridX = gridX;
        this.gridY = gridY;
        this.rotation = rotation;
    }

    // 스펙 3절 "프로젝트 완료 → 나무로 승격"
    public void promoteToTree() {
        this.cropCode = "cherry_tree";
    }
}

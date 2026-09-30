package com.cherry.farm;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// 스펙 8절 — 기한 없음, 진척도 표시 없음, 실패해도 불이익 없음. 조용히
// PENDING → FULFILLED(들어줌) 또는 EXPIRED(오래돼서 새 걸로 교체)로만 바뀐다.
@Entity
@Table(name = "villager_request")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class VillagerRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "villager_code", nullable = false, length = 50)
    private String villagerCode;

    @Column(name = "recipe_code", nullable = false, length = 50)
    private String recipeCode;

    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    // created_at을 DB 기본값에만 맡기면, 만든 것과 같은 트랜잭션 안에서 바로 읽을 때
    // (ensureVillagerRequests → getFarm 응답 조립) 영속성 컨텍스트가 갱신 전 null을
    // 그대로 돌려준다 — 여기서 직접 채워서 그 문제를 피한다.
    public static VillagerRequest create(Long userId, String villagerCode, String recipeCode) {
        VillagerRequest request = new VillagerRequest();
        request.userId = userId;
        request.villagerCode = villagerCode;
        request.recipeCode = recipeCode;
        request.createdAt = LocalDateTime.now();
        return request;
    }

    public boolean isPending() {
        return "PENDING".equals(status);
    }

    public void fulfill(LocalDateTime now) {
        this.status = "FULFILLED";
        this.resolvedAt = now;
    }

    public void expire(LocalDateTime now) {
        this.status = "EXPIRED";
        this.resolvedAt = now;
    }
}

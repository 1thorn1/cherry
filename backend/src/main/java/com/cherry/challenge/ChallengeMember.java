package com.cherry.challenge;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "challenge_member")
@IdClass(ChallengeMemberId.class)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChallengeMember {

    @Id
    @Column(name = "challenge_id")
    private Long challengeId;

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "project_id")
    private Long projectId;

    @Column(insertable = false, updatable = false)
    private LocalDateTime joinedAt;

    @Column(nullable = false)
    private boolean paused = false;

    @Column(name = "shared_memo", length = 200)
    private String sharedMemo;

    private LocalDateTime leftAt;

    public static ChallengeMember create(Long challengeId, Long userId, Long projectId) {
        ChallengeMember member = new ChallengeMember();
        member.challengeId = challengeId;
        member.userId = userId;
        member.projectId = projectId;
        return member;
    }

    public void updatePaused(boolean paused) {
        this.paused = paused;
    }

    public void updateSharedMemo(String sharedMemo) {
        this.sharedMemo = sharedMemo;
    }

    public void leave(LocalDateTime now) {
        this.leftAt = now;
    }
}

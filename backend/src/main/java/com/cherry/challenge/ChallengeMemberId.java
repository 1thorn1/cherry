package com.cherry.challenge;

import java.io.Serializable;
import java.util.Objects;

public class ChallengeMemberId implements Serializable {

    private Long challengeId;
    private Long userId;

    public ChallengeMemberId() {
    }

    public ChallengeMemberId(Long challengeId, Long userId) {
        this.challengeId = challengeId;
        this.userId = userId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ChallengeMemberId that)) return false;
        return Objects.equals(challengeId, that.challengeId) && Objects.equals(userId, that.userId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(challengeId, userId);
    }
}

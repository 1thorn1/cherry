package com.cherry.challenge;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChallengeMemberRepository extends JpaRepository<ChallengeMember, ChallengeMemberId> {

    boolean existsByChallengeIdAndUserIdAndLeftAtIsNull(Long challengeId, Long userId);

    Optional<ChallengeMember> findByChallengeIdAndUserId(Long challengeId, Long userId);

    List<ChallengeMember> findByChallengeIdAndLeftAtIsNullOrderByJoinedAtAsc(Long challengeId);

    List<ChallengeMember> findByUserIdAndLeftAtIsNull(Long userId);

    List<ChallengeMember> findByUserId(Long userId);
}

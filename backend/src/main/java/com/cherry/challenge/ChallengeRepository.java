package com.cherry.challenge;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ChallengeRepository extends JpaRepository<Challenge, Long> {

    Optional<Challenge> findByInviteCode(String inviteCode);

    boolean existsByInviteCode(String inviteCode);
}

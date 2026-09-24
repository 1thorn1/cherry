package com.cherry.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByFriendCode(String friendCode);

    Optional<User> findByProviderAndProviderUid(String provider, String providerUid);
}

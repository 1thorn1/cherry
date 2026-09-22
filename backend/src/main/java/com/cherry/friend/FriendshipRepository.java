package com.cherry.friend;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    List<Friendship> findByAddresseeIdAndStatus(Long addresseeId, String status);

    @Query("select (count(f) > 0) from Friendship f " +
            "where (f.requesterId = :a and f.addresseeId = :b) or (f.requesterId = :b and f.addresseeId = :a)")
    boolean existsBetween(@Param("a") Long a, @Param("b") Long b);

    @Query("select f from Friendship f where (f.requesterId = :userId or f.addresseeId = :userId) and f.status = :status")
    List<Friendship> findAllByUserIdAndStatus(@Param("userId") Long userId, @Param("status") String status);
}

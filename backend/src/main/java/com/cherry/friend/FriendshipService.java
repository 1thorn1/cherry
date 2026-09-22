package com.cherry.friend;

import com.cherry.common.DuplicateFriendRequestException;
import com.cherry.common.FriendCodeNotFoundException;
import com.cherry.common.FriendshipNotFoundException;
import com.cherry.common.SelfFriendRequestException;
import com.cherry.friend.dto.FriendCodeResponse;
import com.cherry.friend.dto.FriendResponse;
import com.cherry.friend.dto.PendingRequestResponse;
import com.cherry.user.User;
import com.cherry.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FriendshipService {

    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public FriendCodeResponse getMyCode(Long userId) {
        User me = userRepository.findById(userId).orElseThrow();
        return new FriendCodeResponse(me.getFriendCode());
    }

    @Transactional
    public void sendRequest(Long userId, String friendCode) {
        User target = userRepository.findByFriendCode(friendCode)
                .orElseThrow(FriendCodeNotFoundException::new);

        if (target.getId().equals(userId)) {
            throw new SelfFriendRequestException();
        }
        if (friendshipRepository.existsBetween(userId, target.getId())) {
            throw new DuplicateFriendRequestException();
        }

        friendshipRepository.save(Friendship.request(userId, target.getId()));
    }

    @Transactional
    public void accept(Long userId, Long friendshipId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
                .filter(f -> f.getAddresseeId().equals(userId))
                .orElseThrow(FriendshipNotFoundException::new);
        friendship.accept(LocalDateTime.now());
    }

    @Transactional(readOnly = true)
    public Long resolveAcceptedPartnerId(Long userId, Long friendshipId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
                .filter(f -> f.involves(userId) && "ACCEPTED".equals(f.getStatus()))
                .orElseThrow(FriendshipNotFoundException::new);
        return friendship.partnerId(userId);
    }

    @Transactional
    public void remove(Long userId, Long friendshipId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
                .filter(f -> f.involves(userId))
                .orElseThrow(FriendshipNotFoundException::new);
        friendshipRepository.delete(friendship);
    }

    @Transactional(readOnly = true)
    public List<PendingRequestResponse> getPendingRequests(Long userId) {
        return friendshipRepository.findByAddresseeIdAndStatus(userId, "PENDING").stream()
                .map(f -> {
                    User requester = userRepository.findById(f.getRequesterId()).orElseThrow();
                    return new PendingRequestResponse(f.getId(), requester.getNickname(), f.getCreatedAt());
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FriendResponse> getFriends(Long userId) {
        return friendshipRepository.findAllByUserIdAndStatus(userId, "ACCEPTED").stream()
                .map(f -> {
                    User friend = userRepository.findById(f.partnerId(userId)).orElseThrow();
                    return new FriendResponse(f.getId(), friend.getNickname(), f.getAcceptedAt());
                })
                .toList();
    }
}

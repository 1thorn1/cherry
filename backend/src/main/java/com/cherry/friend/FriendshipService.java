package com.cherry.friend;

import com.cherry.common.DuplicateFriendRequestException;
import com.cherry.common.FriendCodeNotFoundException;
import com.cherry.common.FriendshipNotFoundException;
import com.cherry.common.SelfFriendRequestException;
import com.cherry.friend.dto.FriendCodeResponse;
import com.cherry.friend.dto.FriendResponse;
import com.cherry.friend.dto.PendingRequestResponse;
import com.cherry.friend.dto.SharingSettingsRequest;
import com.cherry.friend.dto.SharingSettingsResponse;
import com.cherry.park.DailyStat;
import com.cherry.park.DailyStatRepository;
import com.cherry.user.User;
import com.cherry.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FriendshipService {

    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;
    private final DailyStatRepository dailyStatRepository;

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
                    Long partnerId = f.partnerId(userId);
                    User friend = userRepository.findById(partnerId).orElseThrow();
                    Integer activityCount = friend.isShareActivityCount()
                            ? dailyStatRepository.findByUserIdAndStatDate(partnerId, LocalDate.now())
                                    .map(DailyStat::getCompletedCount)
                                    .orElse(0)
                            : null;
                    return new FriendResponse(f.getId(), friend.getNickname(), f.getAcceptedAt(), activityCount);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public SharingSettingsResponse getSharingSettings(Long userId) {
        User me = userRepository.findById(userId).orElseThrow();
        return new SharingSettingsResponse(me.isSharePark(), me.isShareActivityCount(), me.isShareTaskTitles());
    }

    @Transactional
    public SharingSettingsResponse updateSharingSettings(Long userId, SharingSettingsRequest request) {
        User me = userRepository.findById(userId).orElseThrow();
        me.updateSharingSettings(request.sharePark(), request.shareActivityCount(), request.shareTaskTitles());
        return new SharingSettingsResponse(me.isSharePark(), me.isShareActivityCount(), me.isShareTaskTitles());
    }
}

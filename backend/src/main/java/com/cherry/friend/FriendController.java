package com.cherry.friend;

import com.cherry.auth.CurrentUserId;
import com.cherry.friend.dto.FriendCodeResponse;
import com.cherry.friend.dto.FriendResponse;
import com.cherry.friend.dto.PendingRequestResponse;
import com.cherry.friend.dto.SendFriendRequest;
import com.cherry.friend.dto.SharingSettingsRequest;
import com.cherry.friend.dto.SharingSettingsResponse;
import com.cherry.park.ParkService;
import com.cherry.park.dto.FriendParkResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendController {

    private final FriendshipService friendshipService;
    private final ParkService parkService;

    @GetMapping("/code")
    public FriendCodeResponse getMyCode(@CurrentUserId Long userId) {
        return friendshipService.getMyCode(userId);
    }

    @PostMapping
    public ResponseEntity<Void> sendRequest(@CurrentUserId Long userId, @Valid @RequestBody SendFriendRequest request) {
        friendshipService.sendRequest(userId, request.friendCode());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @GetMapping("/requests")
    public List<PendingRequestResponse> getPendingRequests(@CurrentUserId Long userId) {
        return friendshipService.getPendingRequests(userId);
    }

    @PatchMapping("/{id}/accept")
    public ResponseEntity<Void> accept(@CurrentUserId Long userId, @PathVariable Long id) {
        friendshipService.accept(userId, id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remove(@CurrentUserId Long userId, @PathVariable Long id) {
        friendshipService.remove(userId, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public List<FriendResponse> getFriends(@CurrentUserId Long userId) {
        return friendshipService.getFriends(userId);
    }

    @GetMapping("/settings")
    public SharingSettingsResponse getSettings(@CurrentUserId Long userId) {
        return friendshipService.getSharingSettings(userId);
    }

    @PutMapping("/settings")
    public SharingSettingsResponse updateSettings(@CurrentUserId Long userId, @RequestBody SharingSettingsRequest request) {
        return friendshipService.updateSharingSettings(userId, request);
    }

    @GetMapping("/{id}/park")
    public FriendParkResponse viewFriendPark(@CurrentUserId Long userId, @PathVariable Long id) {
        Long hostId = friendshipService.resolveAcceptedPartnerId(userId, id);
        return parkService.getFriendView(hostId);
    }

    @PostMapping("/{id}/visit")
    public ResponseEntity<Void> visitFriendPark(@CurrentUserId Long userId, @PathVariable Long id) {
        Long hostId = friendshipService.resolveAcceptedPartnerId(userId, id);
        parkService.visit(userId, hostId);
        return ResponseEntity.noContent().build();
    }
}

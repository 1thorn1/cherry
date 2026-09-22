package com.cherry.friend;

import com.cherry.friend.dto.FriendCodeResponse;
import com.cherry.friend.dto.FriendResponse;
import com.cherry.friend.dto.PendingRequestResponse;
import com.cherry.friend.dto.SendFriendRequest;
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

    private static final Long DEV_USER_ID = 1L;

    private final FriendshipService friendshipService;

    @GetMapping("/code")
    public FriendCodeResponse getMyCode() {
        return friendshipService.getMyCode(DEV_USER_ID);
    }

    @PostMapping
    public ResponseEntity<Void> sendRequest(@Valid @RequestBody SendFriendRequest request) {
        friendshipService.sendRequest(DEV_USER_ID, request.friendCode());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @GetMapping("/requests")
    public List<PendingRequestResponse> getPendingRequests() {
        return friendshipService.getPendingRequests(DEV_USER_ID);
    }

    @PatchMapping("/{id}/accept")
    public ResponseEntity<Void> accept(@PathVariable Long id) {
        friendshipService.accept(DEV_USER_ID, id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remove(@PathVariable Long id) {
        friendshipService.remove(DEV_USER_ID, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public List<FriendResponse> getFriends() {
        return friendshipService.getFriends(DEV_USER_ID);
    }
}

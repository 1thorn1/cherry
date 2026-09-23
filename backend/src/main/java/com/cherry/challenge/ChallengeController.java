package com.cherry.challenge;

import com.cherry.auth.CurrentUserId;
import com.cherry.challenge.dto.ChallengeCreateRequest;
import com.cherry.challenge.dto.ChallengeDetailResponse;
import com.cherry.challenge.dto.ChallengeJoinRequest;
import com.cherry.challenge.dto.ChallengeMemoRequest;
import com.cherry.challenge.dto.ChallengeProjectLinkResponse;
import com.cherry.challenge.dto.ChallengeResponse;
import com.cherry.challenge.dto.PauseRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/challenges")
@RequiredArgsConstructor
public class ChallengeController {

    private final ChallengeService challengeService;

    @PostMapping
    public ResponseEntity<ChallengeResponse> create(@CurrentUserId Long userId,
                                                     @Valid @RequestBody ChallengeCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(challengeService.create(userId, request));
    }

    @PostMapping("/join")
    public ChallengeResponse join(@CurrentUserId Long userId, @Valid @RequestBody ChallengeJoinRequest request) {
        return challengeService.join(userId, request.inviteCode());
    }

    @GetMapping
    public List<ChallengeResponse> listMine(@CurrentUserId Long userId) {
        return challengeService.listMine(userId);
    }

    @GetMapping("/project-links")
    public List<ChallengeProjectLinkResponse> myProjectLinks(@CurrentUserId Long userId) {
        return challengeService.myProjectLinks(userId);
    }

    @GetMapping("/{id}")
    public ChallengeDetailResponse detail(@CurrentUserId Long userId, @PathVariable Long id) {
        return challengeService.detail(userId, id);
    }

    @PatchMapping("/{id}/pause")
    public ResponseEntity<Void> pause(@CurrentUserId Long userId, @PathVariable Long id, @RequestBody PauseRequest request) {
        challengeService.setPaused(userId, id, request.paused());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/memo")
    public ResponseEntity<Void> memo(@CurrentUserId Long userId, @PathVariable Long id, @Valid @RequestBody ChallengeMemoRequest request) {
        challengeService.updateSharedMemo(userId, id, request.memo());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/leave")
    public ResponseEntity<Void> leave(@CurrentUserId Long userId, @PathVariable Long id) {
        challengeService.leave(userId, id);
        return ResponseEntity.noContent().build();
    }
}

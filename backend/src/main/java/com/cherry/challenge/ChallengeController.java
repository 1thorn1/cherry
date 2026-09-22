package com.cherry.challenge;

import com.cherry.challenge.dto.ChallengeCreateRequest;
import com.cherry.challenge.dto.ChallengeDetailResponse;
import com.cherry.challenge.dto.ChallengeJoinRequest;
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

    private static final Long DEV_USER_ID = 1L;

    private final ChallengeService challengeService;

    @PostMapping
    public ResponseEntity<ChallengeResponse> create(@Valid @RequestBody ChallengeCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(challengeService.create(DEV_USER_ID, request));
    }

    @PostMapping("/join")
    public ChallengeResponse join(@Valid @RequestBody ChallengeJoinRequest request) {
        return challengeService.join(DEV_USER_ID, request.inviteCode());
    }

    @GetMapping
    public List<ChallengeResponse> listMine() {
        return challengeService.listMine(DEV_USER_ID);
    }

    @GetMapping("/project-links")
    public List<ChallengeProjectLinkResponse> myProjectLinks() {
        return challengeService.myProjectLinks(DEV_USER_ID);
    }

    @GetMapping("/{id}")
    public ChallengeDetailResponse detail(@PathVariable Long id) {
        return challengeService.detail(DEV_USER_ID, id);
    }

    @PatchMapping("/{id}/pause")
    public ResponseEntity<Void> pause(@PathVariable Long id, @RequestBody PauseRequest request) {
        challengeService.setPaused(DEV_USER_ID, id, request.paused());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/leave")
    public ResponseEntity<Void> leave(@PathVariable Long id) {
        challengeService.leave(DEV_USER_ID, id);
        return ResponseEntity.noContent().build();
    }
}

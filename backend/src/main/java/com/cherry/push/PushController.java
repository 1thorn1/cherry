package com.cherry.push;

import com.cherry.push.dto.PublicKeyResponse;
import com.cherry.push.dto.SubscribeRequest;
import com.cherry.push.dto.UnsubscribeRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/push")
@RequiredArgsConstructor
public class PushController {

    private static final Long DEV_USER_ID = 1L;

    private final PushSubscriptionRepository pushSubscriptionRepository;

    @Value("${vapid.public-key}")
    private String vapidPublicKey;

    @GetMapping("/public-key")
    public PublicKeyResponse publicKey() {
        return new PublicKeyResponse(vapidPublicKey);
    }

    @PostMapping("/subscribe")
    public ResponseEntity<Void> subscribe(@RequestBody SubscribeRequest request,
                                          @RequestHeader(value = "User-Agent", required = false) String userAgent) {
        if (pushSubscriptionRepository.findByEndpoint(request.endpoint()).isEmpty()) {
            pushSubscriptionRepository.save(PushSubscription.create(
                    DEV_USER_ID, request.endpoint(), request.keys().p256dh(), request.keys().auth(), userAgent));
        }
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/subscribe")
    public ResponseEntity<Void> unsubscribe(@RequestBody UnsubscribeRequest request) {
        pushSubscriptionRepository.findByEndpoint(request.endpoint())
                .ifPresent(pushSubscriptionRepository::delete);
        return ResponseEntity.noContent().build();
    }
}

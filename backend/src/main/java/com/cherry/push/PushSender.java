package com.cherry.push;

import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Security;

@Component
@Slf4j
public class PushSender {

    static {
        // web-push 라이브러리가 ECDH 키 연산에 "BC" provider를 이름으로 찾기 때문에,
        // bcprov jar가 클래스패스에 있는 것만으로는 부족하고 JVM에 provider로 등록해야 함
        Security.addProvider(new BouncyCastleProvider());
    }

    private final PushService pushService;

    public PushSender(@Value("${vapid.public-key}") String publicKey,
                       @Value("${vapid.private-key}") String privateKey,
                       @Value("${vapid.subject}") String subject) throws Exception {
        this.pushService = new PushService(publicKey, privateKey, subject);
    }

    public void send(PushSubscription target, String payload) {
        try {
            Subscription subscription = new Subscription(
                    target.getEndpoint(),
                    new Subscription.Keys(target.getP256dh(), target.getAuth()));
            pushService.send(new Notification(subscription, payload));
        } catch (Exception e) {
            log.warn("푸시 발송 실패: subscriptionId={}", target.getId(), e);
        }
    }
}

package com.cherry.push;

import com.cherry.task.Task;
import com.cherry.task.TaskRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReminderScheduler {

    private final ReminderRepository reminderRepository;
    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final TaskRepository taskRepository;
    private final PushSender pushSender;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Scheduled(cron = "0 * * * * *", zone = "Asia/Seoul")
    @Transactional
    public void sendDueReminders() {
        List<Reminder> due = reminderRepository.findByFireAtLessThanEqualAndSentAtIsNull(LocalDateTime.now());

        for (Reminder reminder : due) {
            taskRepository.findById(reminder.getTaskId()).ifPresent(this::notifySubscribers);
            reminder.markSent(LocalDateTime.now());
        }
    }

    private void notifySubscribers(Task task) {
        String payload = toJson(new PushPayload("체리", task.getTitle()));
        if (payload == null) return;

        pushSubscriptionRepository.findByUserId(task.getUserId())
                .forEach(subscription -> pushSender.send(subscription, payload));
    }

    private String toJson(PushPayload payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            log.warn("푸시 페이로드 직렬화 실패", e);
            return null;
        }
    }
}

package com.cherry.push;

import com.cherry.task.Task;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ReminderService {

    private final ReminderRepository reminderRepository;

    @Transactional
    public void syncReminder(Task task) {
        reminderRepository.deleteByTaskId(task.getId());

        Integer offset = task.getNotifyOffsetMin();
        LocalDateTime start = task.getScheduledStart();
        if (offset == null || start == null) return;

        LocalDateTime fireAt = start.minusMinutes(offset);
        if (fireAt.isBefore(LocalDateTime.now())) return;

        reminderRepository.save(Reminder.create(task.getUserId(), task.getId(), offset, fireAt));
    }

    @Transactional
    public void cancelReminder(Long taskId) {
        reminderRepository.deleteByTaskId(taskId);
    }
}

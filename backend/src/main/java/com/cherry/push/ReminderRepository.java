package com.cherry.push;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ReminderRepository extends JpaRepository<Reminder, Long> {

    void deleteByTaskId(Long taskId);

    List<Reminder> findByFireAtLessThanEqualAndSentAtIsNull(LocalDateTime now);
}

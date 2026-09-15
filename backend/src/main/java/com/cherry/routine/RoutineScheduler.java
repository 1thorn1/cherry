package com.cherry.routine;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneId;

@Component
@RequiredArgsConstructor
public class RoutineScheduler {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final RoutineService routineService;

    @Scheduled(cron = "0 0 4 * * *", zone = "Asia/Seoul")
    public void generateTodayTasks() {
        routineService.generateDueTasksForAllUsers(LocalDate.now(KST));
    }
}

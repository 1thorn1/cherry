package com.cherry.routine.dto;

import com.cherry.routine.Routine;

import java.time.LocalDate;
import java.time.LocalTime;

public record RoutineResponse(
        Long id,
        String title,
        String freq,
        Byte weekdays,
        Byte monthDay,
        LocalTime defaultTime,
        String timeBasis,
        LocalDate startedOn,
        LocalDate endedOn,
        boolean paused,
        long monthCompletedCount
) {
    public static RoutineResponse from(Routine routine) {
        return from(routine, 0);
    }

    public static RoutineResponse from(Routine routine, long monthCompletedCount) {
        return new RoutineResponse(
                routine.getId(),
                routine.getTitle(),
                routine.getFreq(),
                routine.getWeekdays(),
                routine.getMonthDay(),
                routine.getDefaultTime(),
                routine.getTimeBasis(),
                routine.getStartedOn(),
                routine.getEndedOn(),
                routine.isPaused(),
                monthCompletedCount
        );
    }
}

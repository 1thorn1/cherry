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
        boolean paused
) {
    public static RoutineResponse from(Routine routine) {
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
                routine.isPaused()
        );
    }
}

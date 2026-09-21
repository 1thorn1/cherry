package com.cherry.calendar;

import com.cherry.calendar.dto.CalendarDayResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/calendar")
@RequiredArgsConstructor
public class CalendarController {

    private static final Long DEV_USER_ID = 1L;

    private final CalendarService calendarService;

    @GetMapping
    public List<CalendarDayResponse> getWeek(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start) {
        return calendarService.getWeek(DEV_USER_ID, start);
    }
}

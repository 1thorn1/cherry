package com.cherry.calendar;

import com.cherry.calendar.dto.CalendarDayResponse;
import com.cherry.calendar.dto.MonthSummaryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.YearMonth;
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

    @GetMapping("/month")
    public MonthSummaryResponse getMonth(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM") YearMonth month) {
        return calendarService.getMonth(DEV_USER_ID, month);
    }
}

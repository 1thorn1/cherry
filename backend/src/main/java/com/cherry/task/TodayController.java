package com.cherry.task;

import com.cherry.task.dto.TodayResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/today")
@RequiredArgsConstructor
public class TodayController {

    private static final Long DEV_USER_ID = 1L;

    private final TaskService taskService;

    @GetMapping
    public TodayResponse getToday(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        LocalDate target = (date != null) ? date : LocalDate.now();
        return taskService.getToday(DEV_USER_ID, target);
    }
}

package com.cherry.park;

import com.cherry.auth.CurrentUserId;
import com.cherry.park.dto.ParkResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/park")
@RequiredArgsConstructor
public class ParkController {

    private final ParkService parkService;

    @GetMapping
    public ParkResponse get(@CurrentUserId Long userId) {
        return parkService.getStatus(userId);
    }
}

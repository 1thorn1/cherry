package com.cherry.park;

import com.cherry.park.dto.ParkResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/park")
@RequiredArgsConstructor
public class ParkController {

    private static final Long DEV_USER_ID = 1L;

    private final ParkService parkService;

    @GetMapping
    public ParkResponse get() {
        return parkService.getStatus(DEV_USER_ID);
    }
}

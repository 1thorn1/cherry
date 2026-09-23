package com.cherry.routine;

import com.cherry.auth.CurrentUserId;
import com.cherry.routine.dto.RoutineCreateRequest;
import com.cherry.routine.dto.RoutineResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/routines")
@RequiredArgsConstructor
public class RoutineController {

    private final RoutineService routineService;

    @PostMapping
    public ResponseEntity<RoutineResponse> create(@CurrentUserId Long userId, @Valid @RequestBody RoutineCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(routineService.create(userId, request));
    }

    @GetMapping
    public List<RoutineResponse> list(@CurrentUserId Long userId) {
        return routineService.list(userId);
    }

    @PatchMapping("/{id}/pause")
    public RoutineResponse togglePause(@CurrentUserId Long userId, @PathVariable Long id) {
        return routineService.togglePause(userId, id);
    }
}

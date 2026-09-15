package com.cherry.routine;

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

    private static final Long DEV_USER_ID = 1L;

    private final RoutineService routineService;

    @PostMapping
    public ResponseEntity<RoutineResponse> create(@Valid @RequestBody RoutineCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(routineService.create(DEV_USER_ID, request));
    }

    @GetMapping
    public List<RoutineResponse> list() {
        return routineService.list(DEV_USER_ID);
    }

    @PatchMapping("/{id}/pause")
    public RoutineResponse togglePause(@PathVariable Long id) {
        return routineService.togglePause(DEV_USER_ID, id);
    }
}

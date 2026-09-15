package com.cherry.routine;

import com.cherry.common.RoutineNotFoundException;
import com.cherry.routine.dto.RoutineCreateRequest;
import com.cherry.routine.dto.RoutineResponse;
import com.cherry.task.Task;
import com.cherry.task.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RoutineService {

    private final RoutineRepository routineRepository;
    private final TaskRepository taskRepository;

    @Transactional
    public RoutineResponse create(Long userId, RoutineCreateRequest request) {
        Routine routine = Routine.create(userId, request.title().trim(), request.freq(),
                request.weekdays(), request.monthDay(), request.defaultTime(),
                request.timeBasis(), request.startedOn());
        routineRepository.save(routine);
        generateTaskIfDue(routine, LocalDate.now());
        return RoutineResponse.from(routine);
    }

    @Transactional(readOnly = true)
    public List<RoutineResponse> list(Long userId) {
        return routineRepository.findByUserIdAndPausedFalseAndDeletedAtIsNullOrderByCreatedAtAsc(userId)
                .stream().map(RoutineResponse::from).toList();
    }

    @Transactional
    public RoutineResponse togglePause(Long userId, Long routineId) {
        Routine routine = findOwned(userId, routineId);
        if (routine.isPaused()) {
            routine.resume();
        } else {
            routine.pause();
        }
        return RoutineResponse.from(routine);
    }

    @Transactional
    public void generateTaskIfDue(Routine routine, LocalDate date) {
        if (!routine.matches(date)) return;
        if (taskRepository.existsByRoutineIdAndTaskDate(routine.getId(), date)) return;
        taskRepository.save(Task.createFromRoutine(routine, date));
    }

    @Transactional
    public void generateDueTasksForUser(Long userId, LocalDate date) {
        routineRepository.findByUserIdAndPausedFalseAndDeletedAtIsNullOrderByCreatedAtAsc(userId)
                .forEach(routine -> generateTaskIfDue(routine, date));
    }

    @Transactional
    public void generateDueTasksForAllUsers(LocalDate date) {
        routineRepository.findByPausedFalseAndDeletedAtIsNull()
                .forEach(routine -> generateTaskIfDue(routine, date));
    }

    private Routine findOwned(Long userId, Long routineId) {
        return routineRepository.findByIdAndUserIdAndDeletedAtIsNull(routineId, userId)
                .orElseThrow(RoutineNotFoundException::new);
    }
}

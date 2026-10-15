package com.cherry.task;

import com.cherry.common.ProjectNotFoundException;
import com.cherry.farm.FarmService;
import com.cherry.park.ParkService;
import com.cherry.project.Milestone;
import com.cherry.project.MilestoneRepository;
import com.cherry.project.ProjectRepository;
import com.cherry.push.ReminderService;
import com.cherry.routine.Routine;
import com.cherry.routine.RoutineRepository;
import com.cherry.routine.RoutineService;
import com.cherry.task.dto.TaskCompleteRequest;
import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class OfflineCompletionTest {
    private final TaskRepository tasks = mock(TaskRepository.class);
    private final RoutineRepository routines = mock(RoutineRepository.class);
    private final MilestoneRepository milestones = mock(MilestoneRepository.class);
    private final ProjectRepository projects = mock(ProjectRepository.class);
    private final ParkService park = mock(ParkService.class);
    private final TaskService service = new TaskService(tasks, mock(RoutineService.class), routines,
            milestones, projects, park, mock(FarmService.class), mock(ReminderService.class));

    @Test
    void reconnectUsesTheOriginalCompletionTimeAndAwardsOnlyOnce() {
        var checkedAt = LocalDateTime.of(2026, 9, 30, 23, 59);
        var task = Task.create(1L, "Offline task", checkedAt.toLocalDate());
        when(tasks.findByIdAndUserIdAndDeletedAtIsNull(10L, 1L)).thenReturn(Optional.of(task));

        var response = service.complete(1L, 10L, checkedAt);
        assertEquals(checkedAt, response.completedAt());
        assertEquals(checkedAt, response.effectiveAt());
        service.complete(1L, 10L, checkedAt.plusDays(1));
        assertEquals(checkedAt, task.getCompletedAt());
        verify(park, times(1)).awardForTaskCompletion(1L, 10L, checkedAt.toLocalDate(), false);
    }

    @Test
    void midnightUsesTheNewCalendarDateWithoutFourHourAdjustment() {
        var checkedAt = LocalDateTime.of(2026, 10, 1, 0, 2);
        var task = Task.create(1L, "Late task", LocalDate.of(2026, 9, 30));
        when(tasks.findByIdAndUserIdAndDeletedAtIsNull(10L, 1L)).thenReturn(Optional.of(task));
        service.complete(1L, 10L, checkedAt);
        verify(park).awardForTaskCompletion(1L, 10L, LocalDate.of(2026, 10, 1), false);
    }

    @Test
    void scheduledRoutineKeepsItsScheduledEffectiveTime() {
        var date = LocalDate.of(2026, 9, 30);
        var routine = mock(Routine.class);
        when(routine.getId()).thenReturn(50L);
        when(routine.getUserId()).thenReturn(1L);
        when(routine.getDefaultTime()).thenReturn(LocalTime.of(21, 0));
        when(routine.getTimeBasis()).thenReturn("SCHEDULED");
        when(routines.findById(50L)).thenReturn(Optional.of(routine));
        var task = Task.createFromRoutine(routine, date);
        when(tasks.findByIdAndUserIdAndDeletedAtIsNull(10L, 1L)).thenReturn(Optional.of(task));
        var checkedAt = date.plusDays(1).atTime(0, 2);
        var response = service.complete(1L, 10L, checkedAt);
        assertEquals(checkedAt, response.completedAt());
        assertEquals(date.atTime(21, 0), response.effectiveAt());
        verify(park).awardForTaskCompletion(1L, 10L, date.plusDays(1), true);
    }

    @Test
    void offlineMilestoneCompletionRequiresProjectOwnership() {
        when(milestones.findById(20L)).thenReturn(Optional.of(Milestone.create(99L, 1, "Private", null)));
        when(projects.findByIdAndUserIdAndDeletedAtIsNull(99L, 1L)).thenReturn(Optional.empty());
        assertThrows(ProjectNotFoundException.class, () -> service.completeMilestoneNow(1L, 20L, LocalDateTime.now().minusDays(1)));
        verifyNoInteractions(tasks, park);
        assertThrows(ProjectNotFoundException.class, () -> service.uncompleteMilestoneNow(1L, 20L));
    }

    @Test
    void completionRequestAllowsHistoricalTimeAndRejectsFutureTime() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var validator = factory.getValidator();
            assertTrue(validator.validate(new TaskCompleteRequest(LocalDateTime.now().minusDays(1))).isEmpty());
            assertTrue(validator.validate(new TaskCompleteRequest(null)).isEmpty());
            assertFalse(validator.validate(new TaskCompleteRequest(LocalDateTime.now().plusDays(1))).isEmpty());
        }
    }
}

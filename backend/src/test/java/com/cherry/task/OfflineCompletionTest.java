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
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
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
    void requestedTimeIsKeptWithinTheAllowedWindow() {
        var now = LocalDateTime.of(2026, 10, 15, 12, 0);
        var offset = ZoneId.systemDefault().getRules().getOffset(now);
        var yesterday = now.minusDays(1).atOffset(offset);
        assertEquals(now.minusDays(1), TaskService.resolveCompletedAt(yesterday, null, now));
        assertEquals(now, TaskService.resolveCompletedAt(null, null, now));
    }

    @Test
    void futureOrTooOldOrPreCreationTimesFallBackToServerTime() {
        var now = LocalDateTime.of(2026, 10, 15, 12, 0);
        var offset = ZoneId.systemDefault().getRules().getOffset(now);
        // 기기 시계가 몇 초 빠름 — 400 대신 서버 시각
        assertEquals(now, TaskService.resolveCompletedAt(now.plusSeconds(5).atOffset(offset), null, now));
        // 날짜를 바꿔가며 보내서 하루 상한을 피하려는 경우
        assertEquals(now, TaskService.resolveCompletedAt(now.minusDays(10).atOffset(offset), null, now));
        // 할 일이 만들어지기도 전 시각
        assertEquals(now, TaskService.resolveCompletedAt(now.minusHours(2).atOffset(offset), now.minusHours(1), now));
    }

    @Test
    void deviceTimezoneIsConvertedToTheSameInstant() {
        var now = LocalDateTime.of(2026, 10, 15, 12, 0);
        var instant = now.minusHours(1).atZone(ZoneId.systemDefault());
        var fromOtherZone = instant.withZoneSameInstant(ZoneId.of("America/Los_Angeles")).toOffsetDateTime();
        assertEquals(now.minusHours(1), TaskService.resolveCompletedAt(fromOtherZone, null, now));
    }

    @Test
    void repeatedMilestoneCompletionReturnsTheExistingTaskWithoutAwarding() {
        var milestone = Milestone.create(99L, 1, "Done", null);
        var completedAt = LocalDateTime.of(2026, 10, 14, 9, 0);
        milestone.complete(completedAt);
        var existing = Task.create(1L, "Done", null);
        existing.complete(completedAt, completedAt, 20L);
        when(milestones.findById(20L)).thenReturn(Optional.of(milestone));
        when(projects.findByIdAndUserIdAndDeletedAtIsNull(99L, 1L)).thenReturn(Optional.of(mock(com.cherry.project.Project.class)));
        when(tasks.findFirstByMilestoneIdAndUserIdAndCompletedAtIsNotNullAndDeletedAtIsNullOrderByCompletedAtDesc(20L, 1L))
                .thenReturn(Optional.of(existing));

        var response = service.completeMilestoneNow(1L, 20L, LocalDateTime.of(2026, 10, 15, 9, 0));
        assertEquals(completedAt, response.completedAt());
        verify(tasks, never()).save(any());
        verifyNoInteractions(park);
    }
}

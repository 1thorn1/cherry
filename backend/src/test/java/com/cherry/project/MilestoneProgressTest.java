package com.cherry.project;

import com.cherry.common.InvalidProjectException;
import com.cherry.common.ProjectNotFoundException;
import com.cherry.farm.FarmService;
import com.cherry.park.ParkService;
import com.cherry.task.TaskRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class MilestoneProgressTest {
    private final ProjectRepository projects = mock(ProjectRepository.class);
    private final MilestoneRepository milestones = mock(MilestoneRepository.class);
    private final ParkService park = mock(ParkService.class);
    private final ProjectService service = new ProjectService(projects, milestones,
            mock(TaskRepository.class), mock(ProjectNoteRepository.class), park, mock(FarmService.class));

    private Milestone setup(String type, Long milestoneProjectId) {
        when(projects.findByIdAndUserIdAndDeletedAtIsNull(10L, 1L))
                .thenReturn(Optional.of(Project.create(1L, "Test", type, null, null)));
        var milestone = Milestone.create(milestoneProjectId, 1, "Task", null);
        when(milestones.findById(20L)).thenReturn(Optional.of(milestone));
        return milestone;
    }

    @Test
    void progressCanStartResetAndResumeAfterCompletionWithoutAwardingPoints() {
        var milestone = setup("FREE", 10L);
        assertNull(service.updateMilestoneProgress(1L, 10L, 20L, false).startedAt());
        var started = service.updateMilestoneProgress(1L, 10L, 20L, true).startedAt();
        assertNotNull(started);
        assertEquals(started, service.updateMilestoneProgress(1L, 10L, 20L, true).startedAt());
        milestone.complete(LocalDateTime.now());
        assertThrows(InvalidProjectException.class, () -> service.updateMilestoneProgress(1L, 10L, 20L, false));
        milestone.uncomplete();
        assertEquals(started, milestone.getStartedAt());
        assertNull(service.updateMilestoneProgress(1L, 10L, 20L, false).startedAt());
        verifyNoInteractions(park);
    }

    @Test
    void cannotChangeAnotherProjectsMilestone() {
        var milestone = setup("FREE", 99L);
        assertThrows(InvalidProjectException.class, () -> service.updateMilestoneProgress(1L, 10L, 20L, true));
        assertNull(milestone.getStartedAt());
    }

    @Test
    void onlyFreeProjectsAllowManualProgress() {
        setup("PROGRESS", 10L);
        assertThrows(InvalidProjectException.class, () -> service.updateMilestoneProgress(1L, 10L, 20L, true));
    }

    @Test
    void projectOwnershipIsRequired() {
        when(projects.findByIdAndUserIdAndDeletedAtIsNull(10L, 1L)).thenReturn(Optional.empty());
        assertThrows(ProjectNotFoundException.class, () -> service.updateMilestoneProgress(1L, 10L, 20L, true));
        verifyNoInteractions(milestones);
    }
}

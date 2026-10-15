package com.cherry.farm;

import com.cherry.park.PointLedgerRepository;
import com.cherry.project.Milestone;
import com.cherry.project.MilestoneRepository;
import com.cherry.project.Project;
import com.cherry.project.ProjectRepository;
import com.cherry.user.UserRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class FarmHarvestTest {
    private final FarmPlotRepository plots = mock(FarmPlotRepository.class);
    private final InventoryRepository inventories = mock(InventoryRepository.class);
    private final MilestoneRepository milestones = mock(MilestoneRepository.class);
    private final ProjectRepository projects = mock(ProjectRepository.class);
    private final FarmService service = new FarmService(plots, inventories, mock(RecipeRepository.class),
            mock(RecipeIngredientRepository.class), mock(ProductionRepository.class), mock(RecipeDiscoveryRepository.class),
            milestones, projects, mock(PointLedgerRepository.class), mock(UserRepository.class),
            mock(VillagerRepository.class), mock(VillagerRequestRepository.class));

    @Test
    void completeUndoCompleteHarvestsCherriesOnlyOnce() {
        var cherry = Inventory.create(1L, "cherry");
        when(inventories.findByUserIdAndItemCode(1L, "cherry")).thenReturn(Optional.of(cherry));
        var milestone = Milestone.create(99L, 1, "1강", null);
        var springDay = LocalDateTime.of(2026, 4, 1, 10, 0);

        milestone.complete(springDay);
        service.harvest(1L, milestone, springDay);
        milestone.uncomplete();
        milestone.complete(springDay.plusHours(1));
        service.harvest(1L, milestone, springDay.plusHours(1));

        assertEquals(3, cherry.getAmount());
    }

    @Test
    void harvestSeasonFollowsTheCompletionDateNotTheSyncDate() {
        var cherry = Inventory.create(1L, "cherry");
        when(inventories.findByUserIdAndItemCode(1L, "cherry")).thenReturn(Optional.of(cherry));
        var milestone = Milestone.create(99L, 1, "1강", null);
        var lateNovember = LocalDateTime.of(2026, 11, 30, 23, 0);
        milestone.complete(lateNovember);
        service.harvest(1L, milestone, lateNovember);
        assertEquals(4, cherry.getAmount()); // 가을 보너스 +1
    }

    @Test
    void undoingTheLastMilestoneTurnsTheTreeBackIntoItsCrop() {
        var plot = FarmPlot.create(1L, "row_crop_basic", 99L, (byte) 0, (byte) 0);
        var milestone = Milestone.create(99L, 1, "1강", null);
        var project = mock(Project.class);
        when(project.getType()).thenReturn("PROGRESS");
        when(plots.findByUserIdAndProjectId(1L, 99L)).thenReturn(Optional.of(plot));
        when(milestones.findByProjectIdOrderBySeqAsc(99L)).thenReturn(List.of(milestone));
        when(projects.findById(99L)).thenReturn(Optional.of(project));
        when(inventories.findByUserIdAndItemCode(1L, "cherry")).thenReturn(Optional.of(Inventory.create(1L, "cherry")));

        var now = LocalDateTime.of(2026, 4, 1, 10, 0);
        milestone.complete(now);
        service.harvest(1L, milestone, now);
        assertEquals("cherry_tree", plot.getCropCode());

        milestone.uncomplete();
        service.syncTree(1L, 99L);
        assertEquals("row_crop_basic", plot.getCropCode());
    }

    @Test
    void newPlotSkipsCellsThatWereMovedIntoAndStopsWhenTheFarmIsFull() {
        var moved = FarmPlot.create(1L, "row_crop_basic", 10L, (byte) 0, (byte) 0);
        var other = FarmPlot.create(1L, "row_crop_basic", 11L, (byte) 2, (byte) 0);
        when(plots.findByUserIdAndProjectId(eq(1L), anyLong())).thenReturn(Optional.empty());
        when(plots.findByUserId(1L)).thenReturn(List.of(moved, other));

        service.plantForProject(1L, 12L, "PROGRESS");
        verify(plots).save(argThat(plot -> plot.getGridX() == 1 && plot.getGridY() == 0));

        var full = new java.util.ArrayList<FarmPlot>();
        for (int i = 0; i < 20; i++) full.add(FarmPlot.create(1L, "row_crop_basic", 100L + i, (byte) (i % 4), (byte) (i / 4)));
        when(plots.findByUserId(1L)).thenReturn(full);
        clearInvocations(plots);
        service.plantForProject(1L, 13L, "PROGRESS");
        verify(plots, never()).save(any());
    }
}

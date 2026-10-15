package com.cherry.park;

import com.cherry.user.User;
import com.cherry.user.UserRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class ParkServiceTest {
    @Test
    void completionUpdatesEarnedPointsIndependentlyOfVisitors() {
        var ledger = mock(PointLedgerRepository.class);
        var slots = mock(ParkSlotRepository.class);
        var stats = mock(DailyStatRepository.class);
        var users = mock(UserRepository.class);
        var user = mock(User.class);
        var stat = DailyStat.create(1L, LocalDate.now());
        when(users.findById(1L)).thenReturn(Optional.of(user));
        when(stats.findByUserIdAndStatDate(1L, LocalDate.now())).thenReturn(Optional.of(stat));
        when(slots.findByUserIdOrderBySlotIndexAsc(1L)).thenReturn(List.of());
        var service = new ParkService(ledger, slots, stats, mock(ParkVisitRepository.class), users);

        service.awardForTaskCompletion(1L, 10L, LocalDate.now(), false);
        var status = service.getStatus(1L);
        assertEquals(2, status.todayPointsEarned());
        assertEquals(0, status.todayVisitors());
        verify(user).earnPoints(2);

        service.awardForTaskCompletion(1L, 11L, LocalDate.now(), true);
        assertEquals(3, service.getStatus(1L).todayPointsEarned());

        when(ledger.existsByUserIdAndRefTypeAndRefId(1L, "TASK", 10L)).thenReturn(true);
        service.awardForTaskCompletion(1L, 10L, LocalDate.now(), false);
        assertEquals(3, service.getStatus(1L).todayPointsEarned());
    }

    @Test
    void statusWithoutDailyActivityHasNoEarnedPoints() {
        var users = mock(UserRepository.class);
        var stats = mock(DailyStatRepository.class);
        var slots = mock(ParkSlotRepository.class);
        when(users.findById(1L)).thenReturn(Optional.of(mock(User.class)));
        when(stats.findByUserIdAndStatDate(1L, LocalDate.now())).thenReturn(Optional.empty());
        when(slots.findByUserIdOrderBySlotIndexAsc(1L)).thenReturn(List.of());
        var service = new ParkService(mock(PointLedgerRepository.class), slots, stats,
                mock(ParkVisitRepository.class), users);
        assertEquals(0, service.getStatus(1L).todayPointsEarned());
    }
}

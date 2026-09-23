package com.cherry.park;

import com.cherry.common.ParkNotSharedException;
import com.cherry.park.dto.FriendParkResponse;
import com.cherry.park.dto.ParkResponse;
import com.cherry.park.dto.ParkSlotResponse;
import com.cherry.user.User;
import com.cherry.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class ParkService {

    // 스펙(A-8)에 정확한 숫자가 없어 임시로 정한 값. 실사용하며 조정할 것.
    private static final int BASE_PER_COMPLETION = 2;
    // 반복 항목은 "매일 오는 손님이라 신규 방문객이 적다"는 세계관으로 적립을 낮게 (A-6-7 부작용 방어).
    private static final int ROUTINE_BASE_PER_COMPLETION = 1;
    private static final double POPULATION_BONUS_RATE = 0.01; // 인구 100당 +100%
    private static final int DAILY_POINT_CAP = 100;
    private static final int MILESTONE_BONUS = 50;
    private static final int DAILY_VISIT_CAP = 3; // 방문 보너스는 하루 3명까지

    private final PointLedgerRepository pointLedgerRepository;
    private final ParkSlotRepository parkSlotRepository;
    private final DailyStatRepository dailyStatRepository;
    private final ParkVisitRepository parkVisitRepository;
    private final UserRepository userRepository;

    @Transactional
    public void awardForTaskCompletion(Long userId, Long taskId, LocalDate date, boolean isRoutine) {
        if (pointLedgerRepository.existsByUserIdAndRefTypeAndRefId(userId, "TASK", taskId)) return;

        DailyStat stat = dailyStatRepository.findByUserIdAndStatDate(userId, date)
                .orElseGet(() -> dailyStatRepository.save(DailyStat.create(userId, date)));
        User user = userRepository.findById(userId).orElseThrow();

        int newCompletedCount = stat.getCompletedCount() + 1;
        int newPointBasis = stat.getPointBasis() + (isRoutine ? ROUTINE_BASE_PER_COMPLETION : BASE_PER_COMPLETION);
        double populationBonus = user.getPopulation() * POPULATION_BONUS_RATE;
        int rawPoints = (int) Math.floor(newPointBasis * (1 + populationBonus));
        int newPoints = Math.min(rawPoints, DAILY_POINT_CAP);

        int delta = newPoints - stat.getPointsEarned();
        stat.update(newCompletedCount, newPointBasis, stat.getVisitors(), newPoints);

        pointLedgerRepository.save(PointLedger.create(userId, date, delta, "TASK_COMPLETE", "TASK", taskId));
        user.earnPoints(delta);
    }

    @Transactional
    public void awardForMilestoneCompletion(Long userId, Long milestoneId) {
        if (pointLedgerRepository.existsByUserIdAndRefTypeAndRefId(userId, "MILESTONE", milestoneId)) return;

        int nextIndex = parkSlotRepository.countByUserId(userId) + 1;
        parkSlotRepository.save(ParkSlot.create(userId, nextIndex, "BASIC", false, milestoneId));

        User user = userRepository.findById(userId).orElseThrow();
        user.earnPoints(MILESTONE_BONUS);
        user.growPopulation(1);

        pointLedgerRepository.save(PointLedger.create(
                userId, LocalDate.now(), MILESTONE_BONUS, "MILESTONE_COMPLETE", "MILESTONE", milestoneId));
    }

    @Transactional(readOnly = true)
    public ParkResponse getStatus(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        int todayVisitors = dailyStatRepository.findByUserIdAndStatDate(userId, LocalDate.now())
                .map(DailyStat::getVisitors)
                .orElse(0);
        var slots = parkSlotRepository.findByUserIdOrderBySlotIndexAsc(userId)
                .stream().map(ParkSlotResponse::from).toList();

        return new ParkResponse(user.getPopulation(), user.getPointBalance(), todayVisitors, slots);
    }

    @Transactional(readOnly = true)
    public FriendParkResponse getFriendView(Long hostId) {
        User host = userRepository.findById(hostId).orElseThrow();
        if (!host.isSharePark()) {
            throw new ParkNotSharedException();
        }
        var slots = parkSlotRepository.findByUserIdOrderBySlotIndexAsc(hostId)
                .stream().map(ParkSlotResponse::from).toList();

        return new FriendParkResponse(host.getPopulation(), slots);
    }

    @Transactional
    public void visit(Long visitorId, Long hostId) {
        User host = userRepository.findById(hostId).orElseThrow();
        if (!host.isSharePark()) {
            throw new ParkNotSharedException();
        }

        LocalDate today = LocalDate.now();
        if (parkVisitRepository.existsByVisitorIdAndHostIdAndVisitedOn(visitorId, hostId, today)) {
            return; // 오늘 이미 다녀감 — 조용히 무시
        }
        parkVisitRepository.save(ParkVisit.create(visitorId, hostId, today));

        DailyStat stat = dailyStatRepository.findByUserIdAndStatDate(hostId, today)
                .orElseGet(() -> dailyStatRepository.save(DailyStat.create(hostId, today)));
        if (stat.getVisitors() < DAILY_VISIT_CAP) {
            stat.update(stat.getCompletedCount(), stat.getPointBasis(), stat.getVisitors() + 1, stat.getPointsEarned());
        }
    }
}

package com.cherry.task;

import com.cherry.common.MilestoneNotFoundException;
import com.cherry.common.TaskNotFoundException;
import com.cherry.park.ParkService;
import com.cherry.project.Milestone;
import com.cherry.project.MilestoneRepository;
import com.cherry.push.ReminderService;
import com.cherry.routine.RoutineRepository;
import com.cherry.routine.RoutineService;
import com.cherry.task.dto.TaskCreateRequest;
import com.cherry.task.dto.TaskEffectiveTimeRequest;
import com.cherry.task.dto.TaskMemoRequest;
import com.cherry.task.dto.TaskProjectRequest;
import com.cherry.task.dto.TaskReminderRequest;
import com.cherry.task.dto.TaskResponse;
import com.cherry.task.dto.TodayResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.cherry.task.dto.TaskScheduleRequest;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final RoutineService routineService;
    private final RoutineRepository routineRepository;
    private final MilestoneRepository milestoneRepository;
    private final ParkService parkService;
    private final ReminderService reminderService;

    @Transactional
    public TaskResponse create(Long userId, TaskCreateRequest request) {
        Task task = Task.create(userId, request.title().trim(), request.taskDate(),
                request.projectId(), request.milestoneId());
        return TaskResponse.from(taskRepository.save(task));
    }

    @Transactional
    public TodayResponse getToday(Long userId, LocalDate date) {
        if (date.equals(LocalDate.now())) {
            routineService.generateDueTasksForUser(userId, date);
        }

        List<TaskResponse> todo = taskRepository
                .findByUserIdAndTaskDateAndCompletedAtIsNullAndDeletedAtIsNullOrderBySortOrderAsc(userId, date)
                .stream().map(TaskResponse::from).toList();

        List<TaskResponse> done = taskRepository
                .findByUserIdAndTaskDateAndCompletedAtIsNotNullAndDeletedAtIsNullOrderByCompletedAtDesc(userId, date)
                .stream().map(TaskResponse::from).toList();

        // "당겨오기" 대상 풀은 오늘 화면에서만 의미가 있다 (A-11 미완료 이월 상세).
        List<TaskResponse> backlog = date.equals(LocalDate.now())
                ? taskRepository.findBacklog(userId, date).stream().map(TaskResponse::from).toList()
                : List.of();

        return new TodayResponse(date, todo, done, backlog);
    }

    @Transactional
    public TaskResponse complete(Long userId, Long taskId) {
        Task task = findOwned(userId, taskId);
        boolean alreadyCompleted = task.getCompletedAt() != null;

        // 생성 시점에 특정 마일스톤이 지정된 태스크("N강 오늘 할 일로 보내기")만 그 마일스톤을 실제로 완료시킨다.
        // 그냥 프로젝트에 태그된 태스크는 기록용으로만 "현재" 마일스톤에 소프트 연결한다 (완료 처리는 안 함).
        Long presetMilestoneId = task.getMilestoneId();
        Long milestoneIdToTag = presetMilestoneId != null ? presetMilestoneId
                : task.getProjectId() == null ? null
                : milestoneRepository.findFirstByProjectIdAndCompletedAtIsNullOrderBySeqAsc(task.getProjectId())
                        .map(Milestone::getId)
                        .orElse(null);

        LocalDateTime now = LocalDateTime.now();
        task.complete(now, computeEffectiveAt(task, now), milestoneIdToTag);

        if (!alreadyCompleted) {
            parkService.awardForTaskCompletion(userId, taskId, LocalDate.now(), task.getRoutineId() != null);
            if (presetMilestoneId != null) {
                milestoneRepository.findById(presetMilestoneId)
                        .filter(m -> m.getCompletedAt() == null)
                        .ifPresent(m -> {
                            m.complete(LocalDateTime.now());
                            parkService.awardForMilestoneCompletion(userId, presetMilestoneId);
                        });
            }
        }
        return TaskResponse.from(task);
    }

    // 프로젝트 화면에서 직접 마일스톤을 완료(A-6-4 UX 보완). 오늘 화면 체크와 동일하게
    // complete()를 그대로 태워서 포인트·공원·기록이 한 줄로 흐르는 원칙을 유지한다.
    // 이미 "오늘 일정에 추가"로 만들어둔 미완료 태스크가 있으면 그걸 완료하고, 없으면
    // taskDate 없이 새로 만들어 바로 완료한다 — taskDate가 없으면 오늘 화면 목록엔 안
    // 뜨니까, 사용자가 명시적으로 "오늘 일정에 추가"한 것만 오늘 화면에 나타난다.
    @Transactional
    public TaskResponse completeMilestoneNow(Long userId, Long milestoneId) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(MilestoneNotFoundException::new);
        Task task = taskRepository.findFirstByMilestoneIdAndUserIdAndCompletedAtIsNullAndDeletedAtIsNull(milestoneId, userId)
                .orElseGet(() -> taskRepository.save(
                        Task.create(userId, milestone.getTitle(), null,
                                milestone.getProjectId(), milestoneId)));
        return complete(userId, task.getId());
    }

    // "오늘 일정에 추가" 버튼. 이 milestone에 이미 미완료 태스크가 있으면(예: 체크박스로
    // 완료했다가 취소해서 taskDate 없는 태스크가 남아있는 경우) 그걸 재사용해서 오늘
    // 날짜로 옮기기만 한다 — 매번 새 태스크를 만들면 같은 마일스톤이 오늘 화면에
    // 중복으로 뜬다 (실제로 이 버그로 태스크가 두 개씩 생겨있던 걸 확인함).
    @Transactional
    public TaskResponse scheduleMilestoneToday(Long userId, Long milestoneId) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(MilestoneNotFoundException::new);
        Task task = taskRepository.findFirstByMilestoneIdAndUserIdAndCompletedAtIsNullAndDeletedAtIsNull(milestoneId, userId)
                .orElseGet(() -> taskRepository.save(
                        Task.create(userId, milestone.getTitle(), LocalDate.now(),
                                milestone.getProjectId(), milestoneId)));
        task.moveTo(LocalDate.now());
        return TaskResponse.from(task);
    }

    // 칩을 다시 눌러 완료를 취소. 이미 지급된 포인트·인구·공원 슬롯은 되돌리지 않는다 —
    // 일반 태스크 체크 해제(uncomplete())도 같은 원칙이고, 재완료 시 awardForMilestoneCompletion이
    // point_ledger 중복 지급을 막아주므로 두 번 주지도 않는다.
    // 뒷받침하는 완료 태스크가 없어도(예: 오늘 화면에서 먼저 체크 해제했거나 지운 경우)
    // 에러 없이 마일스톤만 되돌린다 — 예전엔 여기서 못 찾으면 예외를 던져서 트랜잭션이
    // 롤백되고 마일스톤도 "완료됨"에 영영 갇히는 버그가 있었다.
    @Transactional
    public void uncompleteMilestoneNow(Long userId, Long milestoneId) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(MilestoneNotFoundException::new);
        milestone.uncomplete();

        taskRepository
                .findFirstByMilestoneIdAndUserIdAndCompletedAtIsNotNullAndDeletedAtIsNullOrderByCompletedAtDesc(milestoneId, userId)
                .ifPresent(Task::reopen);
    }

    // completed_at은 체크한 물리적 시각으로 불변, effective_at이 기록·시간표·통계의 기준이 된다 (A-6-8).
    // 반복의 time_basis가 SCHEDULED고 예정 시각이 있으면 그 시각을, 아니면 지금을 기본값으로 삼는다.
    private LocalDateTime computeEffectiveAt(Task task, LocalDateTime now) {
        if (task.getRoutineId() == null || task.getScheduledStart() == null) {
            return now;
        }
        return routineRepository.findById(task.getRoutineId())
                .filter(r -> "SCHEDULED".equals(r.getTimeBasis()))
                .map(r -> task.getScheduledStart())
                .orElse(now);
    }

    @Transactional
    public TaskResponse setEffectiveTime(Long userId, Long taskId, LocalDateTime effectiveAt) {
        Task task = findOwned(userId, taskId);
        task.changeEffectiveTime(effectiveAt);
        return TaskResponse.from(task);
    }

    @Transactional
    public TaskResponse assignProject(Long userId, Long taskId, TaskProjectRequest request) {
        Task task = findOwned(userId, taskId);
        task.assignProject(request.projectId());
        return TaskResponse.from(task);
    }

    // 오늘 화면 체크박스로 완료 취소. 마일스톤에 연결된 태스크라면(milestoneId 존재) 마일스톤
    // 완료 상태도 같이 되돌린다 — 예전엔 task.uncomplete()가 milestoneId까지 지워버려서
    // 프로젝트 화면 칩은 "완료됨"으로 영영 고정되고, 남은 태스크는 마일스톤과 연결이
    // 끊긴 평범한 할일처럼 보이는 버그가 있었다(그 상태에서 지우면 나중에 칩에서 완료 취소를
    // 눌러도 태스크를 못 찾아 에러가 났다). reopen()으로 milestoneId는 보존해서, 프로젝트 칩
    // 쪽 완료 취소(uncompleteMilestoneNow)와 완전히 같은 방식으로 동작하게 한다.
    @Transactional
    public TaskResponse uncomplete(Long userId, Long taskId) {
        Task task = findOwned(userId, taskId);
        Long milestoneId = task.getMilestoneId();
        task.reopen();
        if (milestoneId != null) {
            milestoneRepository.findById(milestoneId)
                    .filter(m -> m.getCompletedAt() != null)
                    .ifPresent(Milestone::uncomplete);
        }
        return TaskResponse.from(task);
    }

    @Transactional
    public TaskResponse changeMemo(Long userId, Long taskId, TaskMemoRequest request) {
        Task task = findOwned(userId, taskId);
        task.changeMemo(request.memo());
        return TaskResponse.from(task);
    }

    @Transactional
    public TaskResponse schedule(Long userId, Long taskId, TaskScheduleRequest request) {
        Task task = findOwned(userId, taskId);
        if (request.taskDate() != null) {
            task.moveTo(request.taskDate());
        }
        task.schedule(request.scheduledStart(), request.scheduledEnd());
        reminderService.syncReminder(task);
        return TaskResponse.from(task);
    }

    @Transactional
    public TaskResponse postpone(Long userId, Long taskId, LocalDate taskDate) {
        Task task = findOwned(userId, taskId);
        task.postpone(taskDate);
        reminderService.syncReminder(task);
        return TaskResponse.from(task);
    }

    @Transactional
    public TaskResponse setReminder(Long userId, Long taskId, TaskReminderRequest request) {
        Task task = findOwned(userId, taskId);
        task.changeNotifyOffset(request.notifyOffsetMin());
        reminderService.syncReminder(task);
        return TaskResponse.from(task);
    }

    @Transactional
    public void delete(Long userId, Long taskId) {
        Task task = findOwned(userId, taskId);
        task.softDelete(LocalDateTime.now());
        reminderService.cancelReminder(taskId);
    }

    private Task findOwned(Long userId, Long taskId) {
        return taskRepository.findByIdAndUserIdAndDeletedAtIsNull(taskId, userId)
                .orElseThrow(TaskNotFoundException::new);
    }
}

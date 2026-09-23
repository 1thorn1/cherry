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
    // 이미 "오늘로 보내기"로 만들어둔 미완료 태스크가 있으면 그걸 완료하고, 없으면 오늘 날짜로 새로 만들어 바로 완료한다.
    @Transactional
    public TaskResponse completeMilestoneNow(Long userId, Long milestoneId) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(MilestoneNotFoundException::new);
        Task task = taskRepository.findFirstByMilestoneIdAndUserIdAndCompletedAtIsNullAndDeletedAtIsNull(milestoneId, userId)
                .orElseGet(() -> taskRepository.save(
                        Task.create(userId, milestone.getTitle(), LocalDate.now(),
                                milestone.getProjectId(), milestoneId)));
        return complete(userId, task.getId());
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

    @Transactional
    public TaskResponse uncomplete(Long userId, Long taskId) {
        Task task = findOwned(userId, taskId);
        task.uncomplete();
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

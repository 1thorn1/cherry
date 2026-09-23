package com.cherry.challenge;

import com.cherry.challenge.dto.ChallengeCreateRequest;
import com.cherry.challenge.dto.ChallengeDetailResponse;
import com.cherry.challenge.dto.ChallengeProjectLinkResponse;
import com.cherry.challenge.dto.ChallengeResponse;
import com.cherry.challenge.dto.MemberProgressResponse;
import com.cherry.common.AlreadyChallengeMemberException;
import com.cherry.common.ChallengeNotFoundException;
import com.cherry.project.Milestone;
import com.cherry.project.MilestoneRepository;
import com.cherry.project.Project;
import com.cherry.project.ProjectService;
import com.cherry.task.Task;
import com.cherry.task.TaskRepository;
import com.cherry.user.User;
import com.cherry.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChallengeService {

    private static final int RECENT_DAYS = 7;
    private static final int INVITE_CODE_LENGTH = 8;
    private static final String INVITE_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 헷갈리는 O/0, I/1 제외

    private final ChallengeRepository challengeRepository;
    private final ChallengeMemberRepository challengeMemberRepository;
    private final ProjectService projectService;
    private final MilestoneRepository milestoneRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final SecureRandom random = new SecureRandom();

    @Transactional
    public ChallengeResponse create(Long userId, ChallengeCreateRequest request) {
        String type = request.type() != null ? request.type() : "FREE";
        Challenge challenge = Challenge.create(userId, request.title().trim(), type,
                request.totalUnits(), request.targetDate(), generateUniqueInviteCode());
        challengeRepository.save(challenge);

        Project project = projectService.createProject(userId, challenge.getTitle(), type,
                challenge.getTotalUnits(), challenge.getTargetDate(), request.milestoneTitles());
        challengeMemberRepository.save(ChallengeMember.create(challenge.getId(), userId, project.getId()));

        return ChallengeResponse.from(challenge);
    }

    @Transactional
    public ChallengeResponse join(Long userId, String inviteCode) {
        Challenge challenge = challengeRepository.findByInviteCode(inviteCode)
                .filter(c -> c.getClosedAt() == null)
                .orElseThrow(ChallengeNotFoundException::new);

        if (challengeMemberRepository.existsByChallengeIdAndUserId(challenge.getId(), userId)) {
            throw new AlreadyChallengeMemberException();
        }

        List<String> milestoneTitles = "FREE".equals(challenge.getType())
                ? ownerMilestoneTitles(challenge)
                : null;

        Project project = projectService.createProject(userId, challenge.getTitle(), challenge.getType(),
                challenge.getTotalUnits(), challenge.getTargetDate(), milestoneTitles);
        challengeMemberRepository.save(ChallengeMember.create(challenge.getId(), userId, project.getId()));

        return ChallengeResponse.from(challenge);
    }

    @Transactional(readOnly = true)
    public List<ChallengeResponse> listMine(Long userId) {
        List<Long> challengeIds = challengeMemberRepository.findByUserIdAndLeftAtIsNull(userId)
                .stream().map(ChallengeMember::getChallengeId).toList();
        return challengeRepository.findAllById(challengeIds).stream()
                .map(ChallengeResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<ChallengeProjectLinkResponse> myProjectLinks(Long userId) {
        List<ChallengeMember> memberships = challengeMemberRepository.findByUserIdAndLeftAtIsNull(userId);
        Map<Long, Challenge> challengesById = challengeRepository
                .findAllById(memberships.stream().map(ChallengeMember::getChallengeId).toList())
                .stream().collect(Collectors.toMap(Challenge::getId, c -> c));

        return memberships.stream()
                .map(m -> {
                    Challenge challenge = challengesById.get(m.getChallengeId());
                    return new ChallengeProjectLinkResponse(m.getProjectId(), challenge.getId(), challenge.getTitle());
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public ChallengeDetailResponse detail(Long userId, Long challengeId) {
        Challenge challenge = challengeRepository.findById(challengeId)
                .orElseThrow(ChallengeNotFoundException::new);
        if (!challengeMemberRepository.existsByChallengeIdAndUserId(challengeId, userId)) {
            throw new ChallengeNotFoundException();
        }

        LocalDate today = LocalDate.now();
        LocalDate start = today.minusDays(RECENT_DAYS - 1);

        List<MemberProgressResponse> members = challengeMemberRepository
                .findByChallengeIdAndLeftAtIsNullOrderByJoinedAtAsc(challengeId)
                .stream()
                .map(member -> toProgress(member, userId, start, today))
                .toList();

        return new ChallengeDetailResponse(challenge.getId(), challenge.getTitle(), challenge.getType(),
                challenge.getInviteCode(), members);
    }

    @Transactional
    public void setPaused(Long userId, Long challengeId, boolean paused) {
        ChallengeMember member = challengeMemberRepository.findByChallengeIdAndUserId(challengeId, userId)
                .orElseThrow(ChallengeNotFoundException::new);
        member.updatePaused(paused);
    }

    // 공유 메모(A-6-15): 진도 숫자만으로는 "합"만 보이고, 서로 보라고 남기는 한 줄 기록이 안 됨.
    @Transactional
    public void updateSharedMemo(Long userId, Long challengeId, String memo) {
        ChallengeMember member = challengeMemberRepository.findByChallengeIdAndUserId(challengeId, userId)
                .orElseThrow(ChallengeNotFoundException::new);
        String trimmed = memo == null ? null : memo.trim();
        member.updateSharedMemo(trimmed == null || trimmed.isEmpty() ? null : trimmed);
    }

    @Transactional
    public void leave(Long userId, Long challengeId) {
        ChallengeMember member = challengeMemberRepository.findByChallengeIdAndUserId(challengeId, userId)
                .orElseThrow(ChallengeNotFoundException::new);
        member.leave(LocalDateTime.now());
    }

    private List<String> ownerMilestoneTitles(Challenge challenge) {
        ChallengeMember ownerMembership = challengeMemberRepository
                .findByChallengeIdAndUserId(challenge.getId(), challenge.getOwnerId())
                .orElseThrow(ChallengeNotFoundException::new);
        return milestoneRepository.findByProjectIdOrderBySeqAsc(ownerMembership.getProjectId())
                .stream().map(Milestone::getTitle).toList();
    }

    private MemberProgressResponse toProgress(ChallengeMember member, Long userId, LocalDate start, LocalDate today) {
        User user = userRepository.findById(member.getUserId()).orElseThrow();

        List<Milestone> milestones = milestoneRepository.findByProjectIdOrderBySeqAsc(member.getProjectId());
        int total = milestones.size();
        int completed = (int) milestones.stream().filter(m -> m.getCompletedAt() != null).count();

        List<Task> recentTasks = taskRepository.findByProjectIdAndCompletedAtBetweenAndDeletedAtIsNull(
                member.getProjectId(), start.atStartOfDay(), today.atTime(LocalTime.MAX));
        Set<LocalDate> activeDates = new HashSet<>();
        for (Task task : recentTasks) {
            activeDates.add(task.getCompletedAt().toLocalDate());
        }

        List<Boolean> recentActiveDays = new ArrayList<>();
        for (LocalDate day = start; !day.isAfter(today); day = day.plusDays(1)) {
            recentActiveDays.add(activeDates.contains(day));
        }

        return new MemberProgressResponse(user.getNickname(), completed, total, recentActiveDays,
                member.isPaused(), member.getSharedMemo(), member.getUserId().equals(userId));
    }

    private String generateUniqueInviteCode() {
        String code;
        do {
            code = randomCode();
        } while (challengeRepository.existsByInviteCode(code));
        return code;
    }

    private String randomCode() {
        StringBuilder sb = new StringBuilder(INVITE_CODE_LENGTH);
        for (int i = 0; i < INVITE_CODE_LENGTH; i++) {
            sb.append(INVITE_CODE_CHARS.charAt(random.nextInt(INVITE_CODE_CHARS.length())));
        }
        return sb.toString();
    }
}

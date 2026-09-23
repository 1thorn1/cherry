package com.cherry.search;

import com.cherry.project.Milestone;
import com.cherry.project.MilestoneRepository;
import com.cherry.project.Project;
import com.cherry.project.ProjectNote;
import com.cherry.project.ProjectNoteRepository;
import com.cherry.project.ProjectRepository;
import com.cherry.search.dto.SearchResultResponse;
import com.cherry.task.Task;
import com.cherry.task.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class SearchService {

    private static final int RECENT_LIMIT = 20;

    private final TaskRepository taskRepository;
    private final ProjectNoteRepository projectNoteRepository;
    private final ProjectRepository projectRepository;
    private final MilestoneRepository milestoneRepository;

    @Transactional(readOnly = true)
    public List<SearchResultResponse> search(Long userId, String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return recent(userId);
        }
        String trimmed = keyword.trim();

        Stream<SearchResultResponse> taskResults = taskRepository.search(userId, trimmed)
                .stream().map(this::fromTask);

        Stream<SearchResultResponse> noteResults = projectNoteRepository.search(userId, trimmed)
                .stream().map(this::fromNote);

        return Stream.concat(taskResults, noteResults)
                .sorted(Comparator.comparing(SearchResultResponse::at).reversed())
                .toList();
    }

    // 검색어가 비어 있을 때는 결과 없음 대신 최근 기록을 보여준다 (A-6-5).
    private List<SearchResultResponse> recent(Long userId) {
        Stream<SearchResultResponse> taskResults = taskRepository
                .findTop20ByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId)
                .stream().map(this::fromTask);

        Stream<SearchResultResponse> noteResults = projectNoteRepository
                .findTop20ByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId)
                .stream().map(this::fromNote);

        return Stream.concat(taskResults, noteResults)
                .sorted(Comparator.comparing(SearchResultResponse::at).reversed())
                .limit(RECENT_LIMIT)
                .toList();
    }

    private SearchResultResponse fromTask(Task task) {
        return new SearchResultResponse("TASK", task.getId(), task.getTitle(),
                task.getProjectId(), resolveProjectName(task.getProjectId()),
                resolveMilestoneTitle(task.getMilestoneId()), task.getCreatedAt());
    }

    private SearchResultResponse fromNote(ProjectNote note) {
        String text = "LINK".equals(note.getKind()) ? note.getUrl() : note.getBody();
        return new SearchResultResponse(note.getKind(), note.getId(), text,
                note.getProjectId(), resolveProjectName(note.getProjectId()),
                resolveMilestoneTitle(note.getMilestoneId()), note.getCreatedAt());
    }

    private String resolveProjectName(Long projectId) {
        if (projectId == null) return null;
        return projectRepository.findById(projectId).map(Project::getName).orElse(null);
    }

    private String resolveMilestoneTitle(Long milestoneId) {
        if (milestoneId == null) return null;
        return milestoneRepository.findById(milestoneId).map(Milestone::getTitle).orElse(null);
    }
}

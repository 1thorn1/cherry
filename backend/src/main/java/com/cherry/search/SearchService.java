package com.cherry.search;

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

    private final TaskRepository taskRepository;
    private final ProjectNoteRepository projectNoteRepository;
    private final ProjectRepository projectRepository;

    @Transactional(readOnly = true)
    public List<SearchResultResponse> search(Long userId, String keyword) {
        if (keyword == null || keyword.isBlank()) return List.of();
        String trimmed = keyword.trim();

        Stream<SearchResultResponse> taskResults = taskRepository.search(userId, trimmed)
                .stream().map(this::fromTask);

        Stream<SearchResultResponse> noteResults = projectNoteRepository.search(userId, trimmed)
                .stream().map(this::fromNote);

        return Stream.concat(taskResults, noteResults)
                .sorted(Comparator.comparing(SearchResultResponse::at).reversed())
                .toList();
    }

    private SearchResultResponse fromTask(Task task) {
        return new SearchResultResponse("TASK", task.getId(), task.getTitle(),
                task.getProjectId(), resolveProjectName(task.getProjectId()), task.getCreatedAt());
    }

    private SearchResultResponse fromNote(ProjectNote note) {
        String text = "LINK".equals(note.getKind()) ? note.getUrl() : note.getBody();
        return new SearchResultResponse(note.getKind(), note.getId(), text,
                note.getProjectId(), resolveProjectName(note.getProjectId()), note.getCreatedAt());
    }

    private String resolveProjectName(Long projectId) {
        if (projectId == null) return null;
        return projectRepository.findById(projectId).map(Project::getName).orElse(null);
    }
}

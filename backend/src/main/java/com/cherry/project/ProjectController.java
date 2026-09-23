package com.cherry.project;

import com.cherry.auth.CurrentUserId;
import com.cherry.project.dto.MilestoneCreateRequest;
import com.cherry.project.dto.MilestoneResponse;
import com.cherry.project.dto.NoteCreateRequest;
import com.cherry.project.dto.NoteResponse;
import com.cherry.project.dto.NoteUpdateRequest;
import com.cherry.project.dto.ProjectCreateRequest;
import com.cherry.project.dto.ProjectDetailResponse;
import com.cherry.project.dto.ProjectOverviewResponse;
import com.cherry.project.dto.ProjectResponse;
import com.cherry.project.dto.ProjectSharedRequest;
import com.cherry.project.dto.ProjectWorkDaysRequest;
import com.cherry.project.dto.TimelineEntryResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    public ResponseEntity<ProjectResponse> create(@CurrentUserId Long userId, @Valid @RequestBody ProjectCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectService.create(userId, request));
    }

    @GetMapping
    public List<ProjectResponse> list(@CurrentUserId Long userId) {
        return projectService.list(userId);
    }

    @GetMapping("/overview")
    public ProjectOverviewResponse overview(@CurrentUserId Long userId) {
        return projectService.getOverview(userId);
    }

    @GetMapping("/{id}")
    public ProjectDetailResponse detail(@CurrentUserId Long userId, @PathVariable Long id) {
        return projectService.detail(userId, id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@CurrentUserId Long userId, @PathVariable Long id) {
        projectService.deleteProject(userId, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/timeline")
    public List<TimelineEntryResponse> timeline(@CurrentUserId Long userId, @PathVariable Long id) {
        return projectService.timeline(userId, id);
    }

    @PatchMapping("/{id}/shared")
    public ProjectResponse updateShared(@CurrentUserId Long userId, @PathVariable Long id, @RequestBody ProjectSharedRequest request) {
        return projectService.updateShared(userId, id, request);
    }

    @PatchMapping("/{id}/work-days")
    public ProjectResponse updateWorkDays(@CurrentUserId Long userId, @PathVariable Long id, @Valid @RequestBody ProjectWorkDaysRequest request) {
        return projectService.updateWorkDays(userId, id, request);
    }

    @PostMapping("/{id}/milestones")
    public ResponseEntity<MilestoneResponse> addMilestone(@CurrentUserId Long userId, @PathVariable Long id,
                                                           @Valid @RequestBody MilestoneCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectService.addMilestone(userId, id, request));
    }

    @PostMapping("/{id}/notes")
    public ResponseEntity<NoteResponse> addNote(@CurrentUserId Long userId, @PathVariable Long id,
                                                @Valid @RequestBody NoteCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectService.addNote(userId, id, request));
    }

    @PatchMapping("/{id}/notes/{noteId}")
    public NoteResponse updateNote(@CurrentUserId Long userId, @PathVariable Long id, @PathVariable Long noteId,
                                    @RequestBody NoteUpdateRequest request) {
        return projectService.updateNote(userId, id, noteId, request);
    }

    @DeleteMapping("/{id}/notes/{noteId}")
    public ResponseEntity<Void> deleteNote(@CurrentUserId Long userId, @PathVariable Long id, @PathVariable Long noteId) {
        projectService.deleteNote(userId, id, noteId);
        return ResponseEntity.noContent().build();
    }
}

package com.cherry.project;

import com.cherry.project.dto.MilestoneCreateRequest;
import com.cherry.project.dto.MilestoneResponse;
import com.cherry.project.dto.NoteCreateRequest;
import com.cherry.project.dto.NoteResponse;
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

    private static final Long DEV_USER_ID = 1L;

    private final ProjectService projectService;

    @PostMapping
    public ResponseEntity<ProjectResponse> create(@Valid @RequestBody ProjectCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectService.create(DEV_USER_ID, request));
    }

    @GetMapping
    public List<ProjectResponse> list() {
        return projectService.list(DEV_USER_ID);
    }

    @GetMapping("/overview")
    public ProjectOverviewResponse overview() {
        return projectService.getOverview(DEV_USER_ID);
    }

    @GetMapping("/{id}")
    public ProjectDetailResponse detail(@PathVariable Long id) {
        return projectService.detail(DEV_USER_ID, id);
    }

    @GetMapping("/{id}/timeline")
    public List<TimelineEntryResponse> timeline(@PathVariable Long id) {
        return projectService.timeline(DEV_USER_ID, id);
    }

    @PatchMapping("/{id}/shared")
    public ProjectResponse updateShared(@PathVariable Long id, @RequestBody ProjectSharedRequest request) {
        return projectService.updateShared(DEV_USER_ID, id, request);
    }

    @PatchMapping("/{id}/work-days")
    public ProjectResponse updateWorkDays(@PathVariable Long id, @Valid @RequestBody ProjectWorkDaysRequest request) {
        return projectService.updateWorkDays(DEV_USER_ID, id, request);
    }

    @PostMapping("/{id}/milestones")
    public ResponseEntity<MilestoneResponse> addMilestone(@PathVariable Long id,
                                                           @Valid @RequestBody MilestoneCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectService.addMilestone(DEV_USER_ID, id, request));
    }

    @PostMapping("/{id}/notes")
    public ResponseEntity<NoteResponse> addNote(@PathVariable Long id,
                                                @Valid @RequestBody NoteCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectService.addNote(DEV_USER_ID, id, request));
    }
}

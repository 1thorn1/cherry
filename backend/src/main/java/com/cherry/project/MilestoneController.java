package com.cherry.project;

import com.cherry.project.dto.MilestoneResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/milestones")
@RequiredArgsConstructor
public class MilestoneController {

    private static final Long DEV_USER_ID = 1L;

    private final ProjectService projectService;

    @PatchMapping("/{id}/complete")
    public MilestoneResponse complete(@PathVariable Long id) {
        return projectService.completeMilestone(DEV_USER_ID, id);
    }
}

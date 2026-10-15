package com.cherry.project.dto;

import jakarta.validation.constraints.NotNull;

public record MilestoneProgressRequest(@NotNull Boolean inProgress) {
}

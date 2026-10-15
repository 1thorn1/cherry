package com.cherry.task.dto;

import jakarta.validation.constraints.PastOrPresent;
import java.time.LocalDateTime;

public record TaskCompleteRequest(@PastOrPresent LocalDateTime completedAt) {
}

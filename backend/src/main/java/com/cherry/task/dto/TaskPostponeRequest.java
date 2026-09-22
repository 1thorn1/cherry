package com.cherry.task.dto;

import java.time.LocalDate;

public record TaskPostponeRequest(LocalDate taskDate) {
}

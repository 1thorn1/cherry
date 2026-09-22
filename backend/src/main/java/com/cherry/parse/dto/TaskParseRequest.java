package com.cherry.parse.dto;

import jakarta.validation.constraints.NotBlank;

public record TaskParseRequest(
        @NotBlank String text
) {
}

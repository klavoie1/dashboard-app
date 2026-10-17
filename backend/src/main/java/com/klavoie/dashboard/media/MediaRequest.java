package com.klavoie.dashboard.media;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record MediaRequest(
        @NotBlank String kind,
        @NotBlank String title,
        Long seriesId,
        Double number,
        @Pattern(regexp = MediaService.STATUS_PATTERN) String status,
        Integer rating,
        String details) {
}

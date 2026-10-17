package com.klavoie.dashboard.media;

import jakarta.validation.constraints.NotBlank;

public record MediaRequest(
        @NotBlank String kind,
        @NotBlank String title,
        Long seriesId,
        Double number,
        String status,
        Integer rating,
        String details) {
}

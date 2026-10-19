package com.klavoie.dashboard.franchise;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record SeriesRequest(
        @NotBlank String title,
        @NotBlank @Pattern(regexp = "manga|anime|tv|movie|book|light-novel|game|audiobook") String kind,
        @Pattern(regexp = "ongoing|complete|hiatus|cancelled|upcoming") String status,
        Long franchiseId
) {}

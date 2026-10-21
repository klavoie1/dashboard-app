package com.klavoie.dashboard.media;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record EpisodeRequest(
        @NotNull Double number,
        @Min(1) Integer season,
        Double seasonNumber,
        String title,
        @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2}") String airDate,
        @Min(1) Integer minutes,
        @Min(0) Integer views,
        @DecimalMin("1") @DecimalMax("10") Double rating,
        String headline,
        String summary,
        String recap,
        String notes
) {}

package com.klavoie.dashboard.media;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record EpisodeRequest(
        @NotNull Double number,
        String title,
        @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2}") String airDate,
        @Min(0) Integer views,
        @Min(1) @Max(10) Integer rating,
        String summary,
        String notes
) {}

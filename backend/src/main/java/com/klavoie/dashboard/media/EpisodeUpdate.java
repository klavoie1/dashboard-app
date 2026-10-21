package com.klavoie.dashboard.media;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;

// Your own tracking for one episode. Fields left out stay as they are.
public record EpisodeUpdate(
        @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2}") String watchedOn,
        @DecimalMin("1") @DecimalMax("10") Double rating,
        @Min(0) Integer views,
        Boolean favorite,
        String notes
) {}

package com.klavoie.dashboard.media;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

// Logging progress: episodes watched, page reached, minutes listened, percent complete.
public record ProgressRequest(
        @NotNull @Min(0) Double progress,
        @Min(0) Double hoursPlayed
) {}

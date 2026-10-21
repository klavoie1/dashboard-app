package com.klavoie.dashboard.journal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record JournalRequest(
        Long episodeId,
        @NotBlank String quote,
        String reflection,
        @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2}") String writtenOn
) {}

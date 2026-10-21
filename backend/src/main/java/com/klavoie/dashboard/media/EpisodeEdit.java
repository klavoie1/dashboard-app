package com.klavoie.dashboard.media;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;

import java.util.List;

// Everything you can edit about an episode (a full replace). lockedFields left out keeps the current locks.
public record EpisodeEdit(
        String title,
        String headline,
        String summary,
        String recap,
        @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2}") String airDate,
        @Min(1) Integer minutes,
        List<@Pattern(regexp = "title|airDate|minutes|summary") String> lockedFields
) {}

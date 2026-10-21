package com.klavoie.dashboard.providers;

import java.util.List;

// What one provider knows about a title. Any field can be null.
public record Fetched(
        String title,
        String originalTitle,
        String creator,
        Integer releaseYear,
        Integer endYear,
        String format,
        String synopsis,
        Double total,
        Integer unitMinutes,
        List<String> tags,
        String coverUrl,
        String backdropUrl,
        Double score,
        Integer scale,
        Integer votes
) {}

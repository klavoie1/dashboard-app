package com.klavoie.dashboard.providers;

// number counts across the whole show; season and seasonNumber are set for tv.
public record FetchedEpisode(
        int number,
        Integer season,
        Integer seasonNumber,
        String title,
        String airDate,
        Integer minutes,
        String summary,
        Double communityScore,
        Integer communityVotes
) {}

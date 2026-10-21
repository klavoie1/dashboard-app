package com.klavoie.dashboard.media;

public record UpcomingEpisode(Long mediaId, String mediaTitle, String kind, Double number, Integer season,
                              Double seasonNumber, String title, String airDate) {}

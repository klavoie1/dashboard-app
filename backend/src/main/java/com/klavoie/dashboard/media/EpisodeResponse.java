package com.klavoie.dashboard.media;

public record EpisodeResponse(
        Long id,
        Long mediaId,
        Double number,
        String title,
        String airDate,
        Integer views,
        Integer rating,
        String summary,
        String notes) {

    static EpisodeResponse from(Episode e) {
        return new EpisodeResponse(e.getId(), e.getMediaId(), e.getNumber(), e.getTitle(), e.getAirDate(),
                e.getViews(), e.getRating(), e.getSummary(), e.getNotes());
    }
}

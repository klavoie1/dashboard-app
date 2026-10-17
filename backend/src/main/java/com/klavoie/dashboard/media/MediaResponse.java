package com.klavoie.dashboard.media;

public record MediaResponse(
        Long id,
        String kind,
        String title,
        Long seriesId,
        Double number,
        String status,
        Integer rating,
        String details) {

    static MediaResponse from(Media m) {
        return new MediaResponse(m.getId(), m.getKind(), m.getTitle(), m.getSeriesId(),
                m.getNumber(), m.getStatus(), m.getRating(), m.getDetails());
    }
}

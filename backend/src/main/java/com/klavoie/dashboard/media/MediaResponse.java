package com.klavoie.dashboard.media;

// The short form used in lists, the library and the dashboard; MediaDetail has everything else.
public record MediaResponse(
        Long id,
        String kind,
        String title,
        Long seriesId,
        Double number,
        String status,
        Double rating,
        String details,
        String subtitle,
        String creator,
        Integer releaseYear,
        Integer endYear,
        String format,
        String cover,
        String backdrop,
        String backdropPosition,
        Double progress,
        Double total,
        String progressUnit,
        Integer unitMinutes,
        Double hoursPlayed,
        String startedOn,
        String lastActivityOn,
        String finishedOn) {

    static MediaResponse from(Media m) {
        return new MediaResponse(m.getId(), m.getKind(), m.getTitle(), m.getSeriesId(),
                m.getNumber(), m.getStatus(), m.getRating(), m.getDetails(), m.getSubtitle(), m.getCreator(),
                m.getReleaseYear(), m.getEndYear(), m.getFormat(), m.getCover(), m.getBackdrop(),
                m.getBackdropPosition(), m.getProgress(), m.getTotal(), m.getProgressUnit(), m.getUnitMinutes(),
                m.getHoursPlayed(), m.getStartedOn(), m.getLastActivityOn(), m.getFinishedOn());
    }
}

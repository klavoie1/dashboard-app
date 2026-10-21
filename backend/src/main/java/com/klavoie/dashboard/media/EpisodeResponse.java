package com.klavoie.dashboard.media;

import java.util.List;

public record EpisodeResponse(
        Long id,
        Long mediaId,
        Double number,
        Integer season,
        Double seasonNumber,
        String title,
        String airDate,
        Integer minutes,
        Integer views,
        Double rating,
        String headline,
        String summary,
        String recap,
        String notes,
        String watchedOn,
        Boolean favorite,
        Double communityScore,
        Integer communityVotes,
        List<String> lockedFields,
        List<Screenshot> screenshots) {

    public record Screenshot(Long id, String path, String caption) {}

    static EpisodeResponse from(Episode e, List<GalleryImage> images) {
        return new EpisodeResponse(e.getId(), e.getMediaId(), e.getNumber(), e.getSeason(), e.getSeasonNumber(),
                e.getTitle(), e.getAirDate(), e.getMinutes(), e.getViews(), e.getRating(), e.getHeadline(),
                e.getSummary(), e.getRecap(), e.getNotes(), e.getWatchedOn(), e.getFavorite(),
                e.getCommunityScore(), e.getCommunityVotes(), e.getLockedFields().stream().sorted().toList(),
                images.stream().map(i -> new Screenshot(i.getId(), i.getPath(), i.getCaption())).toList());
    }

    static EpisodeResponse from(Episode e) { return from(e, List.of()); }
}

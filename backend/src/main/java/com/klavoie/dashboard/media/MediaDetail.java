package com.klavoie.dashboard.media;

import java.util.List;
import java.util.Map;

// Everything a title page needs in one request.
// siblings are the other entries in the same series, e.g. each anime season, in order.
public record MediaDetail(
        Long id,
        String kind,
        String title,
        Long seriesId,
        Double number,
        String status,
        Double rating,
        String details,
        String subtitle,
        String originalTitle,
        String creator,
        Integer releaseYear,
        Integer endYear,
        String format,
        String ageRating,
        String synopsis,
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
        Integer revisits,
        String finishedOn,
        List<String> lockedFields,
        List<String> tags,
        Map<String, String> links,
        List<Rating> providerRatings,
        List<MilestoneRequest> milestones,
        List<MediaResponse> siblings) {

    public record Rating(String provider, Double score, Integer scale, Integer votes, String fetchedAt) {}

    static MediaDetail from(Media m, List<MediaResponse> siblings) {
        return new MediaDetail(m.getId(), m.getKind(), m.getTitle(), m.getSeriesId(), m.getNumber(), m.getStatus(),
                m.getRating(), m.getDetails(), m.getSubtitle(), m.getOriginalTitle(), m.getCreator(),
                m.getReleaseYear(), m.getEndYear(), m.getFormat(), m.getAgeRating(), m.getSynopsis(), m.getCover(),
                m.getBackdrop(), m.getBackdropPosition(), m.getProgress(), m.getTotal(), m.getProgressUnit(),
                m.getUnitMinutes(), m.getHoursPlayed(), m.getStartedOn(), m.getLastActivityOn(), m.getRevisits(), m.getFinishedOn(), m.getLockedFields().stream().sorted().toList(),
                List.copyOf(m.getTags()), Map.copyOf(m.getLinks()),
                m.getProviderRatings().stream()
                        .map(r -> new Rating(r.getProvider(), r.getScore(), r.getScale(), r.getVotes(), r.getFetchedAt()))
                        .toList(),
                m.getMilestones().stream().map(x -> new MilestoneRequest(x.getLabel(), x.getDone())).toList(),
                siblings);
    }
}

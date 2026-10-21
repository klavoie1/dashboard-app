package com.klavoie.dashboard.media;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

interface EpisodeRepository extends JpaRepository<Episode, Long> {
    List<Episode> findByMediaIdOrderByNumber(Long mediaId);

    Optional<Episode> findByMediaIdAndNumber(Long mediaId, Double number);

    // Episodes airing from today on, for titles you're still following
    @Query("""
            select new com.klavoie.dashboard.media.UpcomingEpisode(m.id, m.title, m.kind, e.number, e.season,
                   e.seasonNumber, e.title, e.airDate)
            from Episode e join Media m on m.id = e.mediaId
            where e.airDate >= :today and m.status not in ('finished', 'dropped')
            order by e.airDate, m.title, e.number""")
    List<UpcomingEpisode> findUpcoming(@Param("today") String today, Pageable page);
}

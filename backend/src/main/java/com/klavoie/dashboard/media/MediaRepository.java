package com.klavoie.dashboard.media;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

interface MediaRepository extends JpaRepository<Media, Long> {
    List<Media> findByKindOrderByTitle(String kind);

    List<Media> findBySeriesIdInOrderByNumber(Collection<Long> seriesIds);

    // The library title already linked to this provider id, if any
    @Query("select m.id from Media m join m.links l where key(l) = :provider and l = :externalId")
    List<Long> findIdsByLink(@Param("provider") String provider, @Param("externalId") String externalId);
}

package com.klavoie.dashboard.media;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

interface MediaRepository extends JpaRepository<Media, Long> {
    List<Media> findByKindOrderByTitle(String kind);

    List<Media> findBySeriesIdInOrderByNumber(Collection<Long> seriesIds);
}

package com.klavoie.dashboard.media;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

interface EpisodeRepository extends JpaRepository<Episode, Long> {
    List<Episode> findByMediaIdOrderByNumber(Long mediaId);
}

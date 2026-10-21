package com.klavoie.dashboard.media;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

interface GalleryImageRepository extends JpaRepository<GalleryImage, Long> {
    List<GalleryImage> findByMediaIdAndEpisodeIdNotNullOrderById(Long mediaId);

    List<GalleryImage> findByEpisodeIdOrderById(Long episodeId);

    // A title's own gallery, without its episodes' screenshots
    List<GalleryImage> findByMediaIdAndEpisodeIdIsNullAndCharacterIdIsNullOrderById(Long mediaId);

    List<GalleryImage> findByCharacterIdOrderById(Long characterId);

    List<GalleryImage> findByMediaId(Long mediaId);
}

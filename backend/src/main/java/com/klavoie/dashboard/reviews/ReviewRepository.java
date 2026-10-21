package com.klavoie.dashboard.reviews;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByMediaIdOrderByWrittenOnDescIdDesc(Long mediaId);

    // Every review with its title, newest first, for the Journal
    @Query("""
            select new com.klavoie.dashboard.reviews.RecentReview(r.id, r.mediaId, m.title, m.kind, m.cover, r.headline, r.body,
                   r.rating, r.spoilers, r.writtenOn)
            from Review r join com.klavoie.dashboard.media.Media m on m.id = r.mediaId
            order by r.writtenOn desc, r.id desc""")
    List<RecentReview> findRecent(Pageable page);
}

package com.klavoie.dashboard.journal;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

interface JournalRepository extends JpaRepository<JournalEntry, Long> {
    List<JournalEntry> findByMediaIdOrderByWrittenOnDescIdDesc(Long mediaId);

    List<JournalEntry> findByMediaIdAndEpisodeIdOrderByWrittenOnDescIdDesc(Long mediaId, Long episodeId);

    // Newest notes across the library, with the title and episode they're about
    @Query("""
            select new com.klavoie.dashboard.journal.RecentEntry(j.id, j.mediaId, m.title, m.kind, m.cover, j.episodeId,
                   e.number, j.quote, j.reflection, j.writtenOn)
            from JournalEntry j join com.klavoie.dashboard.media.Media m on m.id = j.mediaId
                 left join com.klavoie.dashboard.media.Episode e on e.id = j.episodeId
            order by j.writtenOn desc, j.id desc""")
    List<RecentEntry> findRecent(Pageable page);
}

package com.klavoie.dashboard.journal;

public record JournalResponse(Long id, Long mediaId, Long episodeId, String quote, String reflection,
                              String writtenOn, String createdAt) {

    static JournalResponse from(JournalEntry j) {
        return new JournalResponse(j.getId(), j.getMediaId(), j.getEpisodeId(), j.getQuote(), j.getReflection(),
                j.getWrittenOn(), j.getCreatedAt());
    }
}

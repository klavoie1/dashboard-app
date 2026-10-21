package com.klavoie.dashboard.journal;

public record RecentEntry(Long id, Long mediaId, String mediaTitle, String mediaKind, String mediaCover, Long episodeId,
                          Double episodeNumber, String quote, String reflection, String writtenOn) {}

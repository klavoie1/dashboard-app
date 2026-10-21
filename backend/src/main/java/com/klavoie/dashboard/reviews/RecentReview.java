package com.klavoie.dashboard.reviews;

public record RecentReview(Long id, Long mediaId, String mediaTitle, String mediaKind, String mediaCover, String headline,
                           String body, Double rating, Boolean spoilers, String writtenOn) {}

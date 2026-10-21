package com.klavoie.dashboard.reviews;

public record ReviewResponse(Long id, Long mediaId, String headline, String body, Double rating, Boolean spoilers,
                             String writtenOn, String updatedAt) {

    static ReviewResponse from(Review r) {
        return new ReviewResponse(r.getId(), r.getMediaId(), r.getHeadline(), r.getBody(), r.getRating(), r.getSpoilers(),
                r.getWrittenOn(), r.getUpdatedAt());
    }
}

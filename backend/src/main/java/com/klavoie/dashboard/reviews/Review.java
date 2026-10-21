package com.klavoie.dashboard.reviews;

import jakarta.persistence.*;

// Your own written review of a title. A title can have several, e.g. one per re-read.
@Entity
@Table(name = "reviews")
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "INTEGER")
    private Long id;

    @Column(name = "media_id", columnDefinition = "INTEGER")
    private Long mediaId;

    private String headline;

    private String body;

    private Double rating;

    // SQLite has no boolean type; stored as 0/1
    @Column(columnDefinition = "INTEGER")
    private Boolean spoilers = false;

    @Column(name = "written_on")
    private String writtenOn;

    @Column(name = "updated_at")
    private String updatedAt;

    public Long getId() { return id; }

    public Long getMediaId() { return mediaId; }

    public void setMediaId(Long mediaId) { this.mediaId = mediaId; }

    public String getHeadline() { return headline; }

    public void setHeadline(String headline) { this.headline = headline; }

    public String getBody() { return body; }

    public void setBody(String body) { this.body = body; }

    public Double getRating() { return rating; }

    public void setRating(Double rating) { this.rating = rating; }

    public Boolean getSpoilers() { return spoilers; }

    public void setSpoilers(Boolean spoilers) { this.spoilers = spoilers; }

    public String getWrittenOn() { return writtenOn; }

    public void setWrittenOn(String writtenOn) { this.writtenOn = writtenOn; }

    public String getUpdatedAt() { return updatedAt; }

    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}

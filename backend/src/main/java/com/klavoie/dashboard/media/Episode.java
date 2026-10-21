package com.klavoie.dashboard.media;

import jakarta.persistence.*;

@Entity
@Table(name = "episodes")
public class Episode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "INTEGER")
    private Long id;

    @Column(name = "media_id", columnDefinition = "INTEGER")
    private Long mediaId;

    // Position across the whole show; season and seasonNumber place it within tv seasons.
    private Double number;

    private Integer season;

    @Column(name = "season_number")
    private Double seasonNumber;

    private String title;

    @Column(name = "air_date")
    private String airDate;

    private Integer minutes;

    private Integer views;

    private Double rating;

    private String headline;

    private String summary;

    private String recap;

    private String notes;

    @Column(name = "watched_on")
    private String watchedOn;

    // SQLite has no boolean type; stored as 0/1
    @Column(columnDefinition = "INTEGER")
    private Boolean favorite = false;

    @Column(name = "community_score")
    private Double communityScore;

    @Column(name = "community_votes")
    private Integer communityVotes;

    // Comma-separated fields that fetching must leave alone
    @Column(name = "locked_fields")
    private String lockedFields;

    public Long getId() { return id; }

    public Long getMediaId() { return mediaId; }

    public void setMediaId(Long mediaId) { this.mediaId = mediaId; }

    public Double getNumber() { return number; }

    public void setNumber(Double number) { this.number = number; }

    public Integer getSeason() { return season; }

    public void setSeason(Integer season) { this.season = season; }

    public Double getSeasonNumber() { return seasonNumber; }

    public void setSeasonNumber(Double seasonNumber) { this.seasonNumber = seasonNumber; }

    public String getTitle() { return title; }

    public void setTitle(String title) { this.title = title; }

    public String getAirDate() { return airDate; }

    public void setAirDate(String airDate) { this.airDate = airDate; }

    public Integer getMinutes() { return minutes; }

    public void setMinutes(Integer minutes) { this.minutes = minutes; }

    public Integer getViews() { return views; }

    public void setViews(Integer views) { this.views = views; }

    public Double getRating() { return rating; }

    public void setRating(Double rating) { this.rating = rating; }

    public String getHeadline() { return headline; }

    public void setHeadline(String headline) { this.headline = headline; }

    public String getSummary() { return summary; }

    public void setSummary(String summary) { this.summary = summary; }

    public String getRecap() { return recap; }

    public void setRecap(String recap) { this.recap = recap; }

    public String getNotes() { return notes; }

    public void setNotes(String notes) { this.notes = notes; }

    public String getWatchedOn() { return watchedOn; }

    public void setWatchedOn(String watchedOn) { this.watchedOn = watchedOn; }

    public Boolean getFavorite() { return favorite; }

    public void setFavorite(Boolean favorite) { this.favorite = favorite; }

    public Double getCommunityScore() { return communityScore; }

    public void setCommunityScore(Double communityScore) { this.communityScore = communityScore; }

    public Integer getCommunityVotes() { return communityVotes; }

    public java.util.Set<String> getLockedFields() {
        return lockedFields == null || lockedFields.isBlank() ? java.util.Set.of() : java.util.Set.of(lockedFields.split(","));
    }

    public void setLockedFields(java.util.Collection<String> fields) {
        this.lockedFields = fields == null || fields.isEmpty() ? null : String.join(",", new java.util.TreeSet<>(fields));
    }

    public boolean isLocked(String field) { return getLockedFields().contains(field); }

    public void setCommunityVotes(Integer communityVotes) { this.communityVotes = communityVotes; }
}

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

    private Double number;

    private String title;

    @Column(name = "air_date")
    private String airDate;

    private Integer views;

    private Integer rating;

    private String summary;

    private String notes;

    public Long getId() { return id; }

    public Long getMediaId() { return mediaId; }

    public void setMediaId(Long mediaId) { this.mediaId = mediaId; }

    public Double getNumber() { return number; }

    public void setNumber(Double number) { this.number = number; }

    public String getTitle() { return title; }

    public void setTitle(String title) { this.title = title; }

    public String getAirDate() { return airDate; }

    public void setAirDate(String airDate) { this.airDate = airDate; }

    public Integer getViews() { return views; }

    public void setViews(Integer views) { this.views = views; }

    public Integer getRating() { return rating; }

    public void setRating(Integer rating) { this.rating = rating; }

    public String getSummary() { return summary; }

    public void setSummary(String summary) { this.summary = summary; }

    public String getNotes() { return notes; }

    public void setNotes(String notes) { this.notes = notes; }
}

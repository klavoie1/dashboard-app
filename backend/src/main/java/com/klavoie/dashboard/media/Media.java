package com.klavoie.dashboard.media;

import jakarta.persistence.*;


@Entity
@Table(name = "media")
public class Media {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "INTEGER")
    private Long id;

    private String kind;

    private  String title;

    private  Double number;

    private  String status;

    private  Integer rating;

    @Column(name = "series_id", columnDefinition = "INTEGER")
    private  Long seriesId;

    private  String details;

    public Long getId() { return id; }

    public String getKind() { return kind; }

    public void setKind(String kind) { this.kind = kind; }

    public String getTitle() { return title; }

    public void setTitle(String title) { this.title = title; }

    public Double getNumber() { return number; }

    public void setNumber(Double number) { this.number=number; }

    public String getStatus() { return status; }

    public void setStatus(String status) { this.status=status; }

    public Integer getRating() { return rating; }

    public void setRating(Integer rating) { this.rating=rating; }

    public Long getSeriesId() { return seriesId; }

    public void setSeriesId(Long seriesId) { this.seriesId=seriesId; }

    public String getDetails() { return details; }

    public void setDetails(String details) { this.details=details; }

}

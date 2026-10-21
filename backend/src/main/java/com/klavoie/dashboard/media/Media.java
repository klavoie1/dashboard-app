package com.klavoie.dashboard.media;

import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;


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

    private  Double rating;

    @Column(name = "series_id", columnDefinition = "INTEGER")
    private  Long seriesId;

    private  String details;

    private String subtitle;

    @Column(name = "original_title")
    private String originalTitle;

    private String creator;

    @Column(name = "release_year")
    private Integer releaseYear;

    @Column(name = "end_year")
    private Integer endYear;

    private String format;

    @Column(name = "age_rating")
    private String ageRating;

    private String synopsis;

    private String cover;

    private String backdrop;

    @Column(name = "backdrop_position")
    private String backdropPosition;

    private Double progress = 0.0;

    private Double total;

    @Column(name = "progress_unit")
    private String progressUnit;

    @Column(name = "unit_minutes")
    private Integer unitMinutes;

    @Column(name = "hours_played")
    private Double hoursPlayed;

    @Column(name = "started_on")
    private String startedOn;

    @Column(name = "last_activity_on")
    private String lastActivityOn;

    private Integer revisits = 0;

    @Column(name = "finished_on")
    private String finishedOn;

    // Comma-separated field names that fetching must leave alone
    @Column(name = "locked_fields")
    private String lockedFields;

    @ElementCollection
    @CollectionTable(name = "media_tags", joinColumns = @JoinColumn(name = "media_id"))
    @Column(name = "tag")
    @OrderBy
    private Set<String> tags = new LinkedHashSet<>();

    // provider -> that provider's id for this title
    @ElementCollection
    @CollectionTable(name = "media_links", joinColumns = @JoinColumn(name = "media_id"))
    @MapKeyColumn(name = "provider")
    @Column(name = "external_id")
    private Map<String, String> links = new TreeMap<>();

    @ElementCollection
    @CollectionTable(name = "provider_ratings", joinColumns = @JoinColumn(name = "media_id"))
    private List<ProviderRating> providerRatings = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "media_milestones", joinColumns = @JoinColumn(name = "media_id"))
    @OrderColumn(name = "position")
    private List<Milestone> milestones = new ArrayList<>();

    public Long getId() { return id; }

    public String getKind() { return kind; }

    public void setKind(String kind) { this.kind = kind; }

    public String getTitle() { return title; }

    public void setTitle(String title) { this.title = title; }

    public Double getNumber() { return number; }

    public void setNumber(Double number) { this.number=number; }

    public String getStatus() { return status; }

    public void setStatus(String status) { this.status=status; }

    public Double getRating() { return rating; }

    public void setRating(Double rating) { this.rating=rating; }

    public Long getSeriesId() { return seriesId; }

    public void setSeriesId(Long seriesId) { this.seriesId=seriesId; }

    public String getDetails() { return details; }

    public void setDetails(String details) { this.details=details; }

    public String getSubtitle() { return subtitle; }

    public void setSubtitle(String subtitle) { this.subtitle = subtitle; }

    public String getOriginalTitle() { return originalTitle; }

    public void setOriginalTitle(String originalTitle) { this.originalTitle = originalTitle; }

    public String getCreator() { return creator; }

    public void setCreator(String creator) { this.creator = creator; }

    public Integer getReleaseYear() { return releaseYear; }

    public void setReleaseYear(Integer releaseYear) { this.releaseYear = releaseYear; }

    public Integer getEndYear() { return endYear; }

    public void setEndYear(Integer endYear) { this.endYear = endYear; }

    public String getFormat() { return format; }

    public void setFormat(String format) { this.format = format; }

    public String getAgeRating() { return ageRating; }

    public void setAgeRating(String ageRating) { this.ageRating = ageRating; }

    public String getSynopsis() { return synopsis; }

    public void setSynopsis(String synopsis) { this.synopsis = synopsis; }

    public String getCover() { return cover; }

    public void setCover(String cover) { this.cover = cover; }

    public String getBackdrop() { return backdrop; }

    public void setBackdrop(String backdrop) { this.backdrop = backdrop; }

    public String getBackdropPosition() { return backdropPosition; }

    public void setBackdropPosition(String backdropPosition) { this.backdropPosition = backdropPosition; }

    public Double getProgress() { return progress; }

    public void setProgress(Double progress) { this.progress = progress; }

    public Double getTotal() { return total; }

    public void setTotal(Double total) { this.total = total; }

    public String getProgressUnit() { return progressUnit; }

    public void setProgressUnit(String progressUnit) { this.progressUnit = progressUnit; }

    public Integer getUnitMinutes() { return unitMinutes; }

    public void setUnitMinutes(Integer unitMinutes) { this.unitMinutes = unitMinutes; }

    public Double getHoursPlayed() { return hoursPlayed; }

    public void setHoursPlayed(Double hoursPlayed) { this.hoursPlayed = hoursPlayed; }

    public String getStartedOn() { return startedOn; }

    public void setStartedOn(String startedOn) { this.startedOn = startedOn; }

    public String getLastActivityOn() { return lastActivityOn; }

    public void setLastActivityOn(String lastActivityOn) { this.lastActivityOn = lastActivityOn; }

    public Integer getRevisits() { return revisits; }

    public void setRevisits(Integer revisits) { this.revisits = revisits; }

    public String getFinishedOn() { return finishedOn; }

    public void setFinishedOn(String finishedOn) { this.finishedOn = finishedOn; }

    public Set<String> getLockedFields() {
        return lockedFields == null || lockedFields.isBlank() ? Set.of() : Set.of(lockedFields.split(","));
    }

    public void setLockedFields(Collection<String> fields) {
        this.lockedFields = fields == null || fields.isEmpty() ? null : String.join(",", new java.util.TreeSet<>(fields));
    }

    public boolean isLocked(String field) { return getLockedFields().contains(field); }

    public Set<String> getTags() { return tags; }

    public Map<String, String> getLinks() { return links; }

    public List<ProviderRating> getProviderRatings() { return providerRatings; }

    public List<Milestone> getMilestones() { return milestones; }
}

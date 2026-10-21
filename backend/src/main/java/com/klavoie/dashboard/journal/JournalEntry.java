package com.klavoie.dashboard.journal;

import jakarta.persistence.*;

@Entity
@Table(name = "journal_entries")
public class JournalEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "INTEGER")
    private Long id;

    @Column(name = "media_id", columnDefinition = "INTEGER")
    private Long mediaId;

    // Set when the note is about one episode
    @Column(name = "episode_id", columnDefinition = "INTEGER")
    private Long episodeId;

    private String quote;

    private String reflection;

    @Column(name = "written_on")
    private String writtenOn;

    @Column(name = "created_at", insertable = false, updatable = false)
    private String createdAt;

    public Long getId() { return id; }

    public Long getMediaId() { return mediaId; }

    public void setMediaId(Long mediaId) { this.mediaId = mediaId; }

    public Long getEpisodeId() { return episodeId; }

    public void setEpisodeId(Long episodeId) { this.episodeId = episodeId; }

    public String getQuote() { return quote; }

    public void setQuote(String quote) { this.quote = quote; }

    public String getReflection() { return reflection; }

    public void setReflection(String reflection) { this.reflection = reflection; }

    public String getWrittenOn() { return writtenOn; }

    public void setWrittenOn(String writtenOn) { this.writtenOn = writtenOn; }

    public String getCreatedAt() { return createdAt; }
}

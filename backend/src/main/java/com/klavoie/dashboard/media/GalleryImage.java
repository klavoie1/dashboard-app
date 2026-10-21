package com.klavoie.dashboard.media;

import jakarta.persistence.*;

// An image in a gallery: a title's, one episode's (screenshots), or a character's.
// path is the address the page loads it from, under /media/.
@Entity
@Table(name = "images")
public class GalleryImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "INTEGER")
    private Long id;

    private String path;

    private String caption;

    @Column(name = "media_id", columnDefinition = "INTEGER")
    private Long mediaId;

    @Column(name = "episode_id", columnDefinition = "INTEGER")
    private Long episodeId;

    @Column(name = "character_id", columnDefinition = "INTEGER")
    private Long characterId;

    @Column(name = "created_at", insertable = false, updatable = false)
    private String createdAt;

    public Long getId() { return id; }

    public String getPath() { return path; }

    public void setPath(String path) { this.path = path; }

    public String getCaption() { return caption; }

    public void setCaption(String caption) { this.caption = caption; }

    public Long getMediaId() { return mediaId; }

    public void setMediaId(Long mediaId) { this.mediaId = mediaId; }

    public Long getEpisodeId() { return episodeId; }

    public void setEpisodeId(Long episodeId) { this.episodeId = episodeId; }

    public Long getCharacterId() { return characterId; }

    public void setCharacterId(Long characterId) { this.characterId = characterId; }

    public String getCreatedAt() { return createdAt; }
}

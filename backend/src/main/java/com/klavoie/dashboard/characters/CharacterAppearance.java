package com.klavoie.dashboard.characters;

import jakarta.persistence.*;

import java.io.Serializable;
import java.util.Objects;

// A character's part in one title: main or supporting, who voices or plays them, and their place in the cast list.
@Entity
@Table(name = "character_media")
@IdClass(CharacterAppearance.Key.class)
public class CharacterAppearance {

    @Id
    @Column(name = "character_id", columnDefinition = "INTEGER")
    private Long characterId;

    @Id
    @Column(name = "media_id", columnDefinition = "INTEGER")
    private Long mediaId;

    private String role;

    private String actor;

    @Column(name = "actor_language")
    private String actorLanguage;

    private Integer position;

    protected CharacterAppearance() {}

    CharacterAppearance(Long characterId, Long mediaId) {
        this.characterId = characterId;
        this.mediaId = mediaId;
    }

    public Long getCharacterId() { return characterId; }

    public Long getMediaId() { return mediaId; }

    public String getRole() { return role; }

    public void setRole(String role) { this.role = role; }

    public String getActor() { return actor; }

    public void setActor(String actor) { this.actor = actor; }

    public String getActorLanguage() { return actorLanguage; }

    public void setActorLanguage(String actorLanguage) { this.actorLanguage = actorLanguage; }

    public Integer getPosition() { return position; }

    public void setPosition(Integer position) { this.position = position; }

    public static class Key implements Serializable {
        private Long characterId;
        private Long mediaId;

        public Key() {}

        Key(Long characterId, Long mediaId) {
            this.characterId = characterId;
            this.mediaId = mediaId;
        }

        @Override
        public boolean equals(Object o) {
            return o instanceof Key k && Objects.equals(characterId, k.characterId) && Objects.equals(mediaId, k.mediaId);
        }

        @Override
        public int hashCode() { return Objects.hash(characterId, mediaId); }
    }
}

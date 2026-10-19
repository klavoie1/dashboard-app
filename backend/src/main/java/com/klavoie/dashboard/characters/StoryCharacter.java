package com.klavoie.dashboard.characters;

import jakarta.persistence.*;

import java.util.HashSet;
import java.util.Set;

// Named StoryCharacter so it doesn't clash with java.lang.Character.
@Entity
@Table(name = "characters")
public class StoryCharacter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "INTEGER")
    private Long id;

    private String name;

    private String role;

    private String portrait;

    private String about;

    private String details;

    @ElementCollection
    @CollectionTable(name = "character_franchise",
            joinColumns = @JoinColumn(name = "character_id", columnDefinition = "INTEGER"))
    @Column(name = "franchise_id", columnDefinition = "INTEGER")
    private Set<Long> franchiseIds = new HashSet<>();

    @ElementCollection
    @CollectionTable(name = "character_media",
            joinColumns = @JoinColumn(name = "character_id", columnDefinition = "INTEGER"))
    @Column(name = "media_id", columnDefinition = "INTEGER")
    private Set<Long> mediaIds = new HashSet<>();

    public Long getId() { return id; }

    public String getName() { return name; }

    public void setName(String name) { this.name = name; }

    public String getRole() { return role; }

    public void setRole(String role) { this.role = role; }

    public String getPortrait() { return portrait; }

    public void setPortrait(String portrait) { this.portrait = portrait; }

    public String getAbout() { return about; }

    public void setAbout(String about) { this.about = about; }

    public String getDetails() { return details; }

    public void setDetails(String details) { this.details = details; }

    public Set<Long> getFranchiseIds() { return franchiseIds; }

    public Set<Long> getMediaIds() { return mediaIds; }
}

package com.klavoie.dashboard.characters;

import jakarta.persistence.*;

import java.util.Collection;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;

// Named StoryCharacter so it doesn't clash with java.lang.Character.
// Where a character appears (and their part there) lives in CharacterAppearance.
@Entity
@Table(name = "characters")
public class StoryCharacter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "INTEGER")
    private Long id;

    private String name;

    @Column(name = "native_name")
    private String nativeName;

    // A short description of who they are, e.g. "Elven mage"
    private String role;

    private String portrait;

    private String about;

    // Free-form facts as JSON, a list of {label, value} like a title's details
    private String details;

    // SQLite has no boolean type; stored as 0/1
    @Column(columnDefinition = "INTEGER")
    private Boolean favorite = false;

    // Comma-separated fields that fetching must leave alone
    @Column(name = "locked_fields")
    private String lockedFields;

    @ElementCollection
    @CollectionTable(name = "character_franchise",
            joinColumns = @JoinColumn(name = "character_id", columnDefinition = "INTEGER"))
    @Column(name = "franchise_id", columnDefinition = "INTEGER")
    private Set<Long> franchiseIds = new HashSet<>();

    // provider -> that provider's id for this character
    @ElementCollection
    @CollectionTable(name = "character_links",
            joinColumns = @JoinColumn(name = "character_id", columnDefinition = "INTEGER"))
    @MapKeyColumn(name = "provider")
    @Column(name = "external_id")
    private Map<String, String> links = new TreeMap<>();

    public Long getId() { return id; }

    public String getName() { return name; }

    public void setName(String name) { this.name = name; }

    public String getNativeName() { return nativeName; }

    public void setNativeName(String nativeName) { this.nativeName = nativeName; }

    public String getRole() { return role; }

    public void setRole(String role) { this.role = role; }

    public String getPortrait() { return portrait; }

    public void setPortrait(String portrait) { this.portrait = portrait; }

    public String getAbout() { return about; }

    public void setAbout(String about) { this.about = about; }

    public String getDetails() { return details; }

    public void setDetails(String details) { this.details = details; }

    public Boolean getFavorite() { return favorite; }

    public void setFavorite(Boolean favorite) { this.favorite = favorite; }

    public Set<String> getLockedFields() {
        return lockedFields == null || lockedFields.isBlank() ? Set.of() : Set.of(lockedFields.split(","));
    }

    public void setLockedFields(Collection<String> fields) {
        this.lockedFields = fields == null || fields.isEmpty() ? null : String.join(",", new TreeSet<>(fields));
    }

    public boolean isLocked(String field) { return getLockedFields().contains(field); }

    public Set<Long> getFranchiseIds() { return franchiseIds; }

    public Map<String, String> getLinks() { return links; }
}

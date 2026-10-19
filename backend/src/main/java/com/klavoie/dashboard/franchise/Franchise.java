package com.klavoie.dashboard.franchise;

import jakarta.persistence.*;

@Entity
@Table(name = "franchise")
public class Franchise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "INTEGER")
    private Long id;

    private String title;

    @Column(name = "alt_title")
    private String altTitle;

    private String notes;

    public Long getId() { return id; }

    public String getTitle() { return title; }

    public void setTitle(String title) { this.title = title; }

    public String getAltTitle() { return altTitle; }

    public void setAltTitle(String altTitle) { this.altTitle = altTitle; }

    public String getNotes() { return notes; }

    public void setNotes(String notes) { this.notes = notes; }
}

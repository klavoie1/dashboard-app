package com.klavoie.dashboard.media;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class Milestone {

    private String label;

    // SQLite has no boolean type; stored as 0/1
    @Column(columnDefinition = "INTEGER")
    private Boolean done;

    protected Milestone() {}

    Milestone(String label, Boolean done) {
        this.label = label;
        this.done = done;
    }

    public String getLabel() { return label; }

    public Boolean getDone() { return done; }
}

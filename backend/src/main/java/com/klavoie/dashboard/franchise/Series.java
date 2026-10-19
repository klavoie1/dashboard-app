package com.klavoie.dashboard.franchise;

import jakarta.persistence.*;

// One format of a franchise, e.g. the manga or the anime.
@Entity
@Table(name = "series")
public class Series {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "INTEGER")
    private Long id;

    private String title;

    private String kind;

    private String status;

    @Column(name = "franchise_id", columnDefinition = "INTEGER")
    private Long franchiseId;

    public Long getId() { return id; }

    public String getTitle() { return title; }

    public void setTitle(String title) { this.title = title; }

    public String getKind() { return kind; }

    public void setKind(String kind) { this.kind = kind; }

    public String getStatus() { return status; }

    public void setStatus(String status) { this.status = status; }

    public Long getFranchiseId() { return franchiseId; }

    public void setFranchiseId(Long franchiseId) { this.franchiseId = franchiseId; }
}

package com.klavoie.dashboard.media;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

// A provider's community score, cached so the browser never asks the provider itself.
@Embeddable
public class ProviderRating {

    private String provider;

    private Double score;

    private Integer scale;

    private Integer votes;

    @Column(name = "fetched_at")
    private String fetchedAt;

    protected ProviderRating() {}

    ProviderRating(String provider, Double score, Integer scale, Integer votes, String fetchedAt) {
        this.provider = provider;
        this.score = score;
        this.scale = scale;
        this.votes = votes;
        this.fetchedAt = fetchedAt;
    }

    public String getProvider() { return provider; }

    public Double getScore() { return score; }

    public Integer getScale() { return scale; }

    public Integer getVotes() { return votes; }

    public String getFetchedAt() { return fetchedAt; }
}

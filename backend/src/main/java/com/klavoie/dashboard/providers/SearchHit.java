package com.klavoie.dashboard.providers;

// One search result from a provider. imageUrl is the provider's; the app only loads it through the image proxy.
public record SearchHit(
        String provider,
        String externalId,
        String kind,
        String title,
        Integer year,
        String detail,
        String imageUrl
) {}

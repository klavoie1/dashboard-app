package com.klavoie.dashboard.media;

// A value a provider would put in a field, shown next to the current one for you to accept or ignore.
// For cover and backdrop, value is the provider's image address.
public record Suggestion(String field, Object current, Object value, String provider) {}

package com.klavoie.dashboard.settings;

// Secrets are never sent back; the page only learns whether one is set and where from.
public record SettingResponse(String key, String label, String provider, boolean secret,
                              boolean configured, String source, String help) {}

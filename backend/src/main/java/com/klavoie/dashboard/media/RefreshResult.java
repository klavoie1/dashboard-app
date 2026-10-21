package com.klavoie.dashboard.media;

import java.util.Map;

// The updated title, plus why any provider couldn't be read (provider -> message).
public record RefreshResult(MediaDetail media, Map<String, String> problems) {}

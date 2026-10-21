package com.klavoie.dashboard.providers;

import java.util.List;
import java.util.Map;

// A source that only has artwork, found through a title's other links (e.g. Fanart.tv by TMDb or TVDB id)
public interface ArtworkSource {

    String provider();

    boolean configured();

    // links: every provider id saved for the title; slot: "cover" or "backdrop"
    List<ImageOption> images(String kind, Map<String, String> links, String slot) throws Exception;
}

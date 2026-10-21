package com.klavoie.dashboard.providers;

import com.klavoie.dashboard.settings.SettingsService;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

// Fanart.tv: many posters and backgrounds for films and TV, made by fans. Needs a free personal key.
// It has no ids of its own: films are found by their TMDb id, shows by their TVDB id (from TVmaze or TMDb).
@Component
class FanartClient implements ArtworkSource {

    private static final String API = "https://webservice.fanart.tv/v3/";

    private final ProviderHttp http;
    private final SettingsService settings;

    FanartClient(ProviderHttp http, SettingsService settings) {
        this.http = http;
        this.settings = settings;
    }

    @Override
    public String provider() { return "fanarttv"; }

    @Override
    public boolean configured() { return settings.get(SettingsService.FANART_KEY) != null; }

    @Override
    public List<ImageOption> images(String kind, Map<String, String> links, String slot) throws Exception {
        boolean cover = slot.equals("cover");
        String key = "api_key=" + ProviderHttp.encode(settings.get(SettingsService.FANART_KEY));
        if (kind.equals("movie") && links.containsKey("tmdb")) {
            JsonNode res = http.get(API + "movies/" + links.get("tmdb") + "?" + key);
            // Fanart.tv's standard sizes: posters 1000 × 1426, backgrounds 1920 × 1080
            return cover ? list(res.path("movieposter"), "Poster", 1000, 1426) : list(res.path("moviebackground"), "Background", 1920, 1080);
        }
        if (kind.equals("tv") || kind.equals("anime")) {
            String tvdb = tvdbId(links);
            if (tvdb == null) return List.of();
            JsonNode res = http.get(API + "tv/" + tvdb + "?" + key);
            return cover ? list(res.path("tvposter"), "Poster", 1000, 1426) : list(res.path("showbackground"), "Background", 1920, 1080);
        }
        return List.of();
    }

    // TVmaze lists the TVDB id openly; TMDb has it too when a TMDb key is set
    private String tvdbId(Map<String, String> links) throws Exception {
        if (links.containsKey("tvmaze")) {
            JsonNode externals = http.get("https://api.tvmaze.com/shows/" + Integer.parseInt(links.get("tvmaze"))).path("externals");
            if (!externals.path("thetvdb").isNull() && !externals.path("thetvdb").isMissingNode()) return externals.path("thetvdb").asString();
        }
        return null;
    }

    private static List<ImageOption> list(JsonNode images, String label, int width, int height) {
        List<ImageOption> out = new ArrayList<>();
        for (JsonNode i : images) {
            String lang = ProviderHttp.text(i.path("lang"));
            out.add(new ImageOption("fanarttv", i.path("url").asString(), width, height,
                    label + (lang == null || lang.isBlank() || lang.equals("00") ? "" : " · " + lang.toUpperCase())));
            if (out.size() == 30) break;
        }
        return out;
    }
}

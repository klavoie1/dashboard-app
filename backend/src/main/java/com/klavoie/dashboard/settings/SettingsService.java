package com.klavoie.dashboard.settings;

import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@Service
public class SettingsService {

    public static final String MAL_CLIENT_ID = "mal-client-id";
    public static final String TMDB_TOKEN = "tmdb-token";
    public static final String IGDB_CLIENT_ID = "igdb-client-id";
    public static final String IGDB_CLIENT_SECRET = "igdb-client-secret";
    public static final String FANART_KEY = "fanart-api-key";

    record Definition(String key, String label, String provider, boolean secret, String help) {}

    // Everything the settings page can change, in display order
    static final List<Definition> DEFINITIONS = List.of(
            new Definition(MAL_CLIENT_ID, "Client ID", "myanimelist", true,
                    "Optional. Without it, MyAnimeList data comes from Jikan, an open mirror. With a client ID from "
                            + "myanimelist.net/apiconfig, titles and search use MAL's official API."),
            new Definition(TMDB_TOKEN, "API read access token", "tmdb", true,
                    "From themoviedb.org/settings/api. The short API key works too."),
            new Definition(IGDB_CLIENT_ID, "Twitch client ID", "igdb", false,
                    "IGDB signs in through Twitch. Register an app at dev.twitch.tv/console."),
            new Definition(IGDB_CLIENT_SECRET, "Twitch client secret", "igdb", true, null),
            new Definition(FANART_KEY, "Personal API key", "fanarttv", true,
                    "Optional. Adds many more posters and backgrounds for films and TV. Get a free key at fanart.tv/get-an-api-key.")
    );

    private final SettingRepository repo;
    private final Environment env;

    SettingsService(SettingRepository repo, Environment env) {
        this.repo = repo;
        this.env = env;
    }

    // The saved value, or the environment fallback, or null
    @Transactional(readOnly = true)
    public String get(String key) {
        String saved = repo.findById(key).map(Setting::getValue).orElse(null);
        if (saved != null && !saved.isBlank()) return saved;
        String fromEnv = env.getProperty("app.providers." + key);
        return fromEnv == null || fromEnv.isBlank() ? null : fromEnv;
    }

    @Transactional(readOnly = true)
    public List<SettingResponse> list() {
        return DEFINITIONS.stream().map(d -> {
            boolean saved = repo.findById(d.key()).isPresent();
            String value = get(d.key());
            String source = value == null ? null : saved ? "saved" : "environment";
            return new SettingResponse(d.key(), d.label(), d.provider(), d.secret(), value != null, source, d.help());
        }).toList();
    }

    // An empty value removes the saved setting, falling back to the environment
    @Transactional
    public List<SettingResponse> update(Map<String, String> values) {
        for (var entry : values.entrySet()) {
            if (DEFINITIONS.stream().noneMatch(d -> d.key().equals(entry.getKey()))) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown setting " + entry.getKey());
            }
            String value = entry.getValue() == null ? "" : entry.getValue().trim();
            if (value.isEmpty()) {
                repo.deleteById(entry.getKey());
            } else {
                Setting s = repo.findById(entry.getKey()).orElseGet(() -> new Setting(entry.getKey(), value));
                s.setValue(value);
                repo.save(s);
            }
        }
        repo.flush();
        return list();
    }
}

package com.klavoie.dashboard.providers;

import com.klavoie.dashboard.settings.SettingsService;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;

import java.net.http.HttpRequest;
import java.util.ArrayList;
import java.util.List;

// TMDb for movies and tv. Takes the long read access token or the short v3 API key.
@Component
class TmdbClient implements ProviderClient {

    private static final String IMAGES = "https://image.tmdb.org/t/p/original";

    private final ProviderHttp http;
    private final SettingsService settings;

    TmdbClient(ProviderHttp http, SettingsService settings) {
        this.http = http;
        this.settings = settings;
    }

    @Override
    public String provider() { return "tmdb"; }

    @Override
    public boolean configured() { return settings.get(SettingsService.TMDB_TOKEN) != null; }

    @Override
    public List<SearchHit> search(String query) throws Exception {
        JsonNode results = get("search/multi", "query=" + java.net.URLEncoder.encode(query, java.nio.charset.StandardCharsets.UTF_8))
                .path("results");
        List<SearchHit> hits = new ArrayList<>();
        for (JsonNode r : results) {
            String type = r.path("media_type").asString();
            if (!type.equals("movie") && !type.equals("tv")) continue;
            String poster = ProviderHttp.text(r.path("poster_path"));
            hits.add(new SearchHit("tmdb", r.path("id").asString(), type,
                    ProviderHttp.text(r.path(type.equals("tv") ? "name" : "title")),
                    ProviderHttp.year(ProviderHttp.text(r.path(type.equals("tv") ? "first_air_date" : "release_date"))),
                    type.equals("tv") ? "TV series" : "Film",
                    poster == null ? null : "https://image.tmdb.org/t/p/w185" + poster));
            if (hits.size() == 10) break;
        }
        return hits;
    }

    // Every season's episodes, numbered across the whole show; specials (season 0) are left out
    @Override
    public List<FetchedEpisode> episodes(String kind, String externalId) throws Exception {
        if (!kind.equals("tv") && !kind.equals("anime")) return List.of();
        int id = Integer.parseInt(externalId);
        JsonNode show = get("tv/" + id, null);
        List<FetchedEpisode> episodes = new ArrayList<>();
        int overall = 0;
        for (JsonNode s : show.path("seasons")) {
            int season = s.path("season_number").asInt();
            if (season == 0) continue;
            for (JsonNode e : get("tv/" + id + "/season/" + season, null).path("episodes")) {
                overall++;
                Double score = ProviderHttp.number(e.path("vote_average"));
                Integer votes = ProviderHttp.integer(e.path("vote_count"));
                episodes.add(new FetchedEpisode(overall, season, e.path("episode_number").asInt(),
                        ProviderHttp.text(e.path("name")), ProviderHttp.text(e.path("air_date")),
                        ProviderHttp.integer(e.path("runtime")), ProviderHttp.text(e.path("overview")),
                        votes == null || votes == 0 ? null : score, votes == null || votes == 0 ? null : votes));
            }
        }
        return episodes;
    }

    @Override
    public FetchedEpisode episode(String kind, String externalId, FetchedEpisode known) throws Exception {
        if (known.season() == null || known.seasonNumber() == null) return null;
        JsonNode e = get("tv/" + Integer.parseInt(externalId) + "/season/" + known.season() + "/episode/" + known.seasonNumber(), null);
        Integer votes = ProviderHttp.integer(e.path("vote_count"));
        boolean rated = votes != null && votes > 0;
        return new FetchedEpisode(known.number(), known.season(), known.seasonNumber(), ProviderHttp.text(e.path("name")),
                ProviderHttp.text(e.path("air_date")), ProviderHttp.integer(e.path("runtime")), ProviderHttp.text(e.path("overview")),
                rated ? ProviderHttp.number(e.path("vote_average")) : null, rated ? votes : null);
    }

    @Override
    public List<ImageOption> episodeImages(String kind, String externalId, FetchedEpisode known) throws Exception {
        if (known.season() == null || known.seasonNumber() == null) return List.of();
        JsonNode stills = get("tv/" + Integer.parseInt(externalId) + "/season/" + known.season() + "/episode/"
                + known.seasonNumber() + "/images", null).path("stills");
        return sized(stills, "Still", 12);
    }

    // Shows list every role an actor played; films list one character per credit
    @Override
    public List<FetchedCharacter> characters(String kind, String externalId) throws Exception {
        boolean tv = kind.equals("tv") || kind.equals("anime");
        JsonNode cast = get((tv ? "tv/" : "movie/") + Integer.parseInt(externalId) + (tv ? "/aggregate_credits" : "/credits"), null).path("cast");
        List<FetchedCharacter> out = new ArrayList<>();
        for (JsonNode c : cast) {
            String character = tv ? ProviderHttp.text(c.path("roles").path(0).path("character")) : ProviderHttp.text(c.path("character"));
            String creditId = tv ? ProviderHttp.text(c.path("roles").path(0).path("credit_id")) : ProviderHttp.text(c.path("credit_id"));
            if (character == null || character.isBlank() || creditId == null) continue;
            String profile = ProviderHttp.text(c.path("profile_path"));
            out.add(new FetchedCharacter(creditId, character, null, out.size() < 6 ? "MAIN" : "SUPPORTING", null,
                    profile == null ? null : IMAGES + profile, ProviderHttp.text(c.path("name")), null, null));
            if (out.size() == 40) break;
        }
        return out;
    }

    @Override
    public List<ImageOption> images(String kind, String externalId, String slot) throws Exception {
        boolean tv = kind.equals("tv") || kind.equals("anime");
        // Images in English or without text first, which suits artwork behind a title
        JsonNode all = get((tv ? "tv/" : "movie/") + Integer.parseInt(externalId) + "/images", "include_image_language=en,null");
        return slot.equals("cover") ? sized(all.path("posters"), "Poster", 16) : sized(all.path("backdrops"), "Backdrop", 16);
    }

    @Override
    public List<SearchHit> similar(String kind, String externalId) throws Exception {
        boolean tv = kind.equals("tv") || kind.equals("anime");
        return cards(get((tv ? "tv/" : "movie/") + Integer.parseInt(externalId) + "/recommendations", null).path("results"), tv ? "tv" : "movie");
    }

    @Override
    public List<Shelf> trending() throws Exception {
        return List.of(new Shelf("tmdb-trending", "Trending films and TV", "Popular on TMDb this week",
                cards(get("trending/all/week", null).path("results"), null)));
    }

    private static List<SearchHit> cards(JsonNode results, String kind) {
        List<SearchHit> out = new ArrayList<>();
        for (JsonNode r : results) {
            String type = kind != null ? kind : r.path("media_type").asString();
            if (!type.equals("movie") && !type.equals("tv")) continue;
            String poster = ProviderHttp.text(r.path("poster_path"));
            out.add(new SearchHit("tmdb", r.path("id").asString(), type, ProviderHttp.text(r.path(type.equals("tv") ? "name" : "title")),
                    ProviderHttp.year(ProviderHttp.text(r.path(type.equals("tv") ? "first_air_date" : "release_date"))),
                    type.equals("tv") ? "TV series" : "Film", poster == null ? null : "https://image.tmdb.org/t/p/w342" + poster));
            if (out.size() == 12) break;
        }
        return out;
    }

    private static List<ImageOption> sized(JsonNode list, String label, int limit) {
        List<ImageOption> options = new ArrayList<>();
        for (JsonNode i : list) {
            String path = ProviderHttp.text(i.path("file_path"));
            if (path == null) continue;
            String language = ProviderHttp.text(i.path("iso_639_1"));
            options.add(new ImageOption("tmdb", IMAGES + path, ProviderHttp.integer(i.path("width")),
                    ProviderHttp.integer(i.path("height")), language == null ? label : label + " · " + language.toUpperCase()));
            if (options.size() == limit) break;
        }
        return options;
    }

    // Read access tokens are JWTs sent as a bearer token; the older v3 key goes in the query string
    private JsonNode get(String path, String query) throws Exception {
        String token = settings.get(SettingsService.TMDB_TOKEN);
        boolean bearer = token.startsWith("eyJ");
        String params = query == null ? "" : query;
        if (!bearer) params = (params.isEmpty() ? "" : params + "&") + "api_key=" + token;
        HttpRequest.Builder req = http.request("https://api.themoviedb.org/3/" + path + (params.isEmpty() ? "" : "?" + params)).GET();
        if (bearer) req.header("Authorization", "Bearer " + token);
        return http.send(req.build());
    }

    @Override
    public Fetched fetch(String kind, String externalId) throws Exception {
        boolean tv = kind.equals("tv") || kind.equals("anime");
        JsonNode m = get((tv ? "tv/" : "movie/") + Integer.parseInt(externalId), null);

        List<String> genres = new ArrayList<>();
        m.path("genres").forEach(g -> genres.add(g.path("name").asString()));
        String start = ProviderHttp.text(m.path(tv ? "first_air_date" : "release_date"));
        Integer minutes = tv ? ProviderHttp.integer(m.path("episode_run_time").path(0)) : ProviderHttp.integer(m.path("runtime"));
        String creator = tv ? ProviderHttp.text(m.path("created_by").path(0).path("name"))
                : ProviderHttp.text(m.path("production_companies").path(0).path("name"));
        String poster = ProviderHttp.text(m.path("poster_path"));
        String backdrop = ProviderHttp.text(m.path("backdrop_path"));

        return new Fetched(
                ProviderHttp.text(m.path(tv ? "name" : "title")),
                ProviderHttp.text(m.path(tv ? "original_name" : "original_title")),
                creator,
                ProviderHttp.year(start),
                tv && "Ended".equals(ProviderHttp.text(m.path("status")))
                        ? ProviderHttp.year(ProviderHttp.text(m.path("last_air_date"))) : null,
                tv ? "TV series" : "Film",
                ProviderHttp.text(m.path("overview")),
                // A film's length is its runtime; a show's is its episode count
                tv ? ProviderHttp.number(m.path("number_of_episodes")) : minutes == null ? null : minutes.doubleValue(),
                tv ? minutes : null,
                genres,
                poster == null ? null : IMAGES + poster,
                backdrop == null ? null : IMAGES + backdrop,
                ProviderHttp.number(m.path("vote_average")), 10,
                ProviderHttp.integer(m.path("vote_count")));
    }
}

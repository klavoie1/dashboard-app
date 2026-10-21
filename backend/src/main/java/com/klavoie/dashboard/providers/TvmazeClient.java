package com.klavoie.dashboard.providers;

import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.List;

// TVmaze for tv shows: details, every episode with summaries and stills, cast and artwork. No key needed.
@Component
class TvmazeClient implements ProviderClient {

    private static final String API = "https://api.tvmaze.com/";

    private final ProviderHttp http;

    TvmazeClient(ProviderHttp http) { this.http = http; }

    @Override
    public String provider() { return "tvmaze"; }

    @Override
    public boolean configured() { return true; }

    @Override
    public List<SearchHit> search(String query) throws Exception {
        List<SearchHit> hits = new ArrayList<>();
        for (JsonNode r : http.get(API + "search/shows?q=" + ProviderHttp.encode(query))) {
            JsonNode s = r.path("show");
            hits.add(new SearchHit("tvmaze", s.path("id").asString(), "tv", ProviderHttp.text(s.path("name")),
                    ProviderHttp.year(ProviderHttp.text(s.path("premiered"))), network(s),
                    ProviderHttp.text(s.path("image").path("medium"))));
            if (hits.size() == 10) break;
        }
        return hits;
    }

    @Override
    public Fetched fetch(String kind, String externalId) throws Exception {
        int id = Integer.parseInt(externalId);
        JsonNode s = http.get(API + "shows/" + id);
        List<String> genres = new ArrayList<>();
        s.path("genres").forEach(g -> genres.add(g.asString()));
        int episodes = http.get(API + "shows/" + id + "/episodes").size();
        Integer minutes = ProviderHttp.integer(s.path("averageRuntime"));
        return new Fetched(
                ProviderHttp.text(s.path("name")), null, network(s),
                ProviderHttp.year(ProviderHttp.text(s.path("premiered"))),
                ProviderHttp.year(ProviderHttp.text(s.path("ended"))),
                "TV series",
                ProviderHttp.plain(ProviderHttp.text(s.path("summary"))),
                episodes == 0 ? null : (double) episodes,
                minutes == null ? ProviderHttp.integer(s.path("runtime")) : minutes,
                genres,
                ProviderHttp.text(s.path("image").path("original")), null,
                // TVmaze gives an average out of 10 without a vote count
                ProviderHttp.number(s.path("rating").path("average")), 10, 0);
    }

    @Override
    public List<FetchedEpisode> episodes(String kind, String externalId) throws Exception {
        List<FetchedEpisode> out = new ArrayList<>();
        int overall = 0;
        for (JsonNode e : http.get(API + "shows/" + Integer.parseInt(externalId) + "/episodes")) {
            // Specials have no number, so they're left out like TMDb's season 0
            if (e.path("number").isNull() || e.path("number").isMissingNode()) continue;
            overall++;
            out.add(toEpisode(e, overall));
        }
        return out;
    }

    @Override
    public FetchedEpisode episode(String kind, String externalId, FetchedEpisode known) throws Exception {
        if (known.season() == null || known.seasonNumber() == null) return null;
        JsonNode e = http.get(API + "shows/" + Integer.parseInt(externalId) + "/episodebynumber?season="
                + known.season() + "&number=" + known.seasonNumber());
        return toEpisode(e, known.number());
    }

    @Override
    public List<ImageOption> episodeImages(String kind, String externalId, FetchedEpisode known) throws Exception {
        if (known.season() == null || known.seasonNumber() == null) return List.of();
        JsonNode e = http.get(API + "shows/" + Integer.parseInt(externalId) + "/episodebynumber?season="
                + known.season() + "&number=" + known.seasonNumber());
        String url = ProviderHttp.text(e.path("image").path("original"));
        return url == null ? List.of() : List.of(new ImageOption("tvmaze", url, null, null, "Still"));
    }

    @Override
    public List<FetchedCharacter> characters(String kind, String externalId) throws Exception {
        List<FetchedCharacter> out = new ArrayList<>();
        for (JsonNode c : http.get(API + "shows/" + Integer.parseInt(externalId) + "/cast")) {
            JsonNode ch = c.path("character");
            String image = ProviderHttp.text(ch.path("image").path("original"));
            if (image == null) image = ProviderHttp.text(c.path("person").path("image").path("original"));
            out.add(new FetchedCharacter(ch.path("id").asString(), ProviderHttp.text(ch.path("name")), null,
                    out.size() < 6 ? "MAIN" : "SUPPORTING", null, image,
                    ProviderHttp.text(c.path("person").path("name")), null, null));
        }
        return out;
    }

    @Override
    public FetchedCharacter character(String characterId) throws Exception {
        JsonNode c = http.get(API + "characters/" + Integer.parseInt(characterId));
        return new FetchedCharacter(characterId, ProviderHttp.text(c.path("name")), null, null, null,
                ProviderHttp.text(c.path("image").path("original")), null, null, null);
    }

    // TVmaze reports each image's full size
    @Override
    public List<ImageOption> images(String kind, String externalId, String slot) throws Exception {
        List<ImageOption> options = new ArrayList<>();
        for (JsonNode i : http.get(API + "shows/" + Integer.parseInt(externalId) + "/images")) {
            String type = i.path("type").asString();
            boolean wanted = slot.equals("cover") ? type.equals("poster") : type.equals("background") || type.equals("banner");
            JsonNode original = i.path("resolutions").path("original");
            String url = ProviderHttp.text(original.path("url"));
            if (!wanted || url == null) continue;
            options.add(new ImageOption("tvmaze", url, ProviderHttp.integer(original.path("width")),
                    ProviderHttp.integer(original.path("height")), type.substring(0, 1).toUpperCase() + type.substring(1)));
        }
        return options;
    }

    private static FetchedEpisode toEpisode(JsonNode e, int overall) {
        return new FetchedEpisode(overall, ProviderHttp.integer(e.path("season")), ProviderHttp.integer(e.path("number")),
                ProviderHttp.text(e.path("name")), ProviderHttp.text(e.path("airdate")), ProviderHttp.integer(e.path("runtime")),
                ProviderHttp.plain(ProviderHttp.text(e.path("summary"))), ProviderHttp.number(e.path("rating").path("average")), null);
    }

    private static String network(JsonNode show) {
        String network = ProviderHttp.text(show.path("network").path("name"));
        return network != null ? network : ProviderHttp.text(show.path("webChannel").path("name"));
    }
}

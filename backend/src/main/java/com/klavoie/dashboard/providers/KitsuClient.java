package com.klavoie.dashboard.providers;

import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.List;

// Kitsu for anime and manga: details, every episode with thumbnails, posters and banners. No key needed.
// Ids are numbers; a pasted kitsu.app link gives a slug, which is looked up.
@Component
class KitsuClient implements ProviderClient {

    private static final String API = "https://kitsu.app/api/edge/";

    private final ProviderHttp http;

    KitsuClient(ProviderHttp http) { this.http = http; }

    @Override
    public String provider() { return "kitsu"; }

    @Override
    public boolean configured() { return true; }

    // Kitsu speaks JSON:API, which wants its own Accept header
    private JsonNode get(String path) throws Exception {
        return http.send(http.request(API + path).header("Accept", "application/vnd.api+json").GET().build());
    }

    private static String section(String kind) { return kind.equals("anime") || kind.equals("movie") ? "anime" : "manga"; }

    private String id(String kind, String externalId) throws Exception {
        if (externalId.matches("\\d+")) return externalId;
        JsonNode found = get(section(kind) + "?filter%5Bslug%5D=" + ProviderHttp.encode(externalId)).path("data").path(0);
        if (found.isMissingNode()) throw new IllegalArgumentException("Not found on Kitsu; check the linked id");
        return found.path("id").asString();
    }

    @Override
    public List<SearchHit> search(String query) throws Exception {
        List<SearchHit> hits = new ArrayList<>();
        for (String section : List.of("anime", "manga")) {
            for (JsonNode n : get(section + "?page%5Blimit%5D=6&filter%5Btext%5D=" + ProviderHttp.encode(query)).path("data")) {
                JsonNode a = n.path("attributes");
                hits.add(new SearchHit("kitsu", n.path("id").asString(), kindOf(section, ProviderHttp.text(a.path("subtype"))),
                        title(a), ProviderHttp.year(ProviderHttp.text(a.path("startDate"))), ProviderHttp.text(a.path("subtype")),
                        ProviderHttp.text(a.path("posterImage").path("small"))));
            }
        }
        return hits;
    }

    @Override
    public Fetched fetch(String kind, String externalId) throws Exception {
        boolean anime = section(kind).equals("anime");
        JsonNode a = get(section(kind) + "/" + id(kind, externalId)).path("data").path("attributes");
        int votes = 0;
        for (var entry : a.path("ratingFrequencies").properties()) votes += entry.getValue().asInt();
        String rating = ProviderHttp.text(a.path("averageRating"));
        return new Fetched(title(a), ProviderHttp.text(a.path("titles").path("ja_jp")), null,
                ProviderHttp.year(ProviderHttp.text(a.path("startDate"))), ProviderHttp.year(ProviderHttp.text(a.path("endDate"))),
                ProviderHttp.text(a.path("subtype")), ProviderHttp.text(a.path("synopsis")),
                ProviderHttp.number(a.path(anime ? "episodeCount" : "volumeCount")),
                anime ? ProviderHttp.integer(a.path("episodeLength")) : null, null,
                ProviderHttp.text(a.path("posterImage").path("original")), ProviderHttp.text(a.path("coverImage").path("original")),
                rating == null ? null : Double.valueOf(rating), 100, votes);
    }

    // Kitsu pages episodes 20 at a time
    @Override
    public List<FetchedEpisode> episodes(String kind, String externalId) throws Exception {
        if (!section(kind).equals("anime")) return List.of();
        String id = id(kind, externalId);
        List<FetchedEpisode> out = new ArrayList<>();
        for (int offset = 0; offset < 2000; offset += 20) {
            JsonNode res = get("anime/" + id + "/episodes?page%5Blimit%5D=20&page%5Boffset%5D=" + offset + "&sort=number");
            for (JsonNode n : res.path("data")) {
                JsonNode e = n.path("attributes");
                if (e.path("number").isNull()) continue;
                out.add(new FetchedEpisode(e.path("number").asInt(), null, null, ProviderHttp.text(e.path("canonicalTitle")),
                        ProviderHttp.text(e.path("airdate")), ProviderHttp.integer(e.path("length")),
                        ProviderHttp.text(e.path("synopsis")), null, null));
            }
            if (res.path("links").path("next").isMissingNode()) break;
        }
        return out;
    }

    @Override
    public FetchedEpisode episode(String kind, String externalId, FetchedEpisode known) throws Exception {
        JsonNode e = episodeNode(kind, externalId, known);
        if (e == null) return null;
        return new FetchedEpisode(known.number(), known.season(), known.seasonNumber(), ProviderHttp.text(e.path("canonicalTitle")),
                ProviderHttp.text(e.path("airdate")), ProviderHttp.integer(e.path("length")), ProviderHttp.text(e.path("synopsis")), null, null);
    }

    @Override
    public List<ImageOption> episodeImages(String kind, String externalId, FetchedEpisode known) throws Exception {
        JsonNode e = episodeNode(kind, externalId, known);
        String url = e == null ? null : ProviderHttp.text(e.path("thumbnail").path("original"));
        return url == null ? List.of() : List.of(new ImageOption("kitsu", url, null, null, "Thumbnail"));
    }

    private JsonNode episodeNode(String kind, String externalId, FetchedEpisode known) throws Exception {
        if (!section(kind).equals("anime")) return null;
        JsonNode n = get("anime/" + id(kind, externalId) + "/episodes?filter%5Bnumber%5D=" + known.number()).path("data").path(0);
        return n.isMissingNode() ? null : n.path("attributes");
    }

    // Kitsu reports sizes for its smaller versions; the original is measured by the server
    @Override
    public List<ImageOption> images(String kind, String externalId, String slot) throws Exception {
        JsonNode a = get(section(kind) + "/" + id(kind, externalId)).path("data").path("attributes");
        JsonNode image = a.path(slot.equals("cover") ? "posterImage" : "coverImage");
        String url = ProviderHttp.text(image.path("original"));
        return url == null ? List.of() : List.of(new ImageOption("kitsu", url, null, null, slot.equals("cover") ? "Poster" : "Banner"));
    }

    private static String kindOf(String section, String subtype) {
        if (section.equals("anime")) return "movie".equals(subtype) ? "movie" : "anime";
        return "novel".equals(subtype) ? "light-novel" : "manga";
    }

    private static String title(JsonNode a) {
        String english = ProviderHttp.text(a.path("titles").path("en"));
        return english != null && !english.isBlank() ? english : ProviderHttp.text(a.path("canonicalTitle"));
    }
}

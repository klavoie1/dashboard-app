package com.klavoie.dashboard.providers;

import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.List;

// MangaDex for manga: details, reader ratings and every volume cover in every language. No key needed.
// Ids are UUIDs, as in mangadex.org/title/<id>.
@Component
class MangaDexClient implements ProviderClient {

    private static final String API = "https://api.mangadex.org/";
    private static final String COVERS = "https://uploads.mangadex.org/covers/";

    private final ProviderHttp http;

    MangaDexClient(ProviderHttp http) { this.http = http; }

    @Override
    public String provider() { return "mangadex"; }

    @Override
    public boolean configured() { return true; }

    private static String id(String externalId) {
        String id = externalId.trim().toLowerCase();
        if (!id.matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")) {
            throw new IllegalArgumentException("MangaDex ids look like b0b721ff-c388-4486-aa0f-c2b0bb321512");
        }
        return id;
    }

    @Override
    public List<SearchHit> search(String query) throws Exception {
        List<SearchHit> hits = new ArrayList<>();
        for (JsonNode m : http.get(API + "manga?limit=8&includes%5B%5D=cover_art&includes%5B%5D=author&title=" + ProviderHttp.encode(query)).path("data")) {
            JsonNode a = m.path("attributes");
            String cover = coverFile(m);
            hits.add(new SearchHit("mangadex", m.path("id").asString(), "manga", title(a), ProviderHttp.integer(a.path("year")),
                    author(m), cover == null ? null : COVERS + m.path("id").asString() + "/" + cover + ".256.jpg"));
        }
        return hits;
    }

    @Override
    public Fetched fetch(String kind, String externalId) throws Exception {
        String id = id(externalId);
        JsonNode m = http.get(API + "manga/" + id + "?includes%5B%5D=cover_art&includes%5B%5D=author").path("data");
        JsonNode a = m.path("attributes");
        List<String> tags = new ArrayList<>();
        for (JsonNode t : a.path("tags")) {
            if ("genre".equals(t.path("attributes").path("group").asString())) tags.add(t.path("attributes").path("name").path("en").asString());
        }
        JsonNode stats = http.get(API + "statistics/manga/" + id).path("statistics").path(id);
        int votes = 0;
        for (var entry : stats.path("rating").path("distribution").properties()) votes += entry.getValue().asInt();
        String lastVolume = ProviderHttp.text(a.path("lastVolume"));
        String cover = coverFile(m);
        return new Fetched(title(a), ProviderHttp.text(nativeTitle(a)), author(m), ProviderHttp.integer(a.path("year")), null,
                "Manga", ProviderHttp.markdown(ProviderHttp.text(a.path("description").path("en"))),
                lastVolume == null || !lastVolume.matches("\\d+") ? null : Double.valueOf(lastVolume), null, tags,
                cover == null ? null : COVERS + id + "/" + cover, null,
                ProviderHttp.number(stats.path("rating").path("bayesian")), 10, votes);
    }

    // Every volume cover, Japanese first, then English, then the rest; the server measures their sizes
    @Override
    public List<ImageOption> images(String kind, String externalId, String slot) throws Exception {
        if (!slot.equals("cover")) return List.of();
        String id = id(externalId);
        List<ImageOption> options = new ArrayList<>();
        JsonNode covers = http.get(API + "cover?limit=100&manga%5B%5D=" + id + "&order%5Bvolume%5D=asc").path("data");
        for (String wanted : List.of("ja", "en", "*")) {
            for (JsonNode c : covers) {
                JsonNode a = c.path("attributes");
                String locale = a.path("locale").asString();
                boolean match = wanted.equals("*") ? !locale.equals("ja") && !locale.equals("en") : locale.equals(wanted);
                if (!match) continue;
                String volume = ProviderHttp.text(a.path("volume"));
                options.add(new ImageOption("mangadex", COVERS + id + "/" + a.path("fileName").asString(), null, null,
                        (volume == null ? "Cover" : "Volume " + volume) + " · " + locale.toUpperCase()));
                if (options.size() == 40) return options;
            }
        }
        return options;
    }

    private static String title(JsonNode a) {
        for (JsonNode alt : a.path("altTitles")) {
            if (alt.has("en")) return alt.path("en").asString();
        }
        JsonNode titles = a.path("title");
        return titles.has("en") ? titles.path("en").asString() : titles.properties().stream().findFirst().map(e -> e.getValue().asString()).orElse(null);
    }

    private static JsonNode nativeTitle(JsonNode a) {
        for (JsonNode alt : a.path("altTitles")) {
            if (alt.has("ja")) return alt.path("ja");
        }
        return null;
    }

    private static String coverFile(JsonNode manga) {
        for (JsonNode r : manga.path("relationships")) {
            if ("cover_art".equals(r.path("type").asString())) return ProviderHttp.text(r.path("attributes").path("fileName"));
        }
        return null;
    }

    private static String author(JsonNode manga) {
        for (JsonNode r : manga.path("relationships")) {
            if ("author".equals(r.path("type").asString())) return ProviderHttp.text(r.path("attributes").path("name"));
        }
        return null;
    }
}

package com.klavoie.dashboard.providers;

import com.klavoie.dashboard.settings.SettingsService;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;

import java.net.URLEncoder;
import java.net.http.HttpRequest;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

// IGDB for games. Signs in with a Twitch app's client id and secret.
@Component
class IgdbClient implements ProviderClient {

    private static final String IMAGES = "https://images.igdb.com/igdb/image/upload/";

    private final ProviderHttp http;
    private final SettingsService settings;
    // Twitch app tokens last about two months, so keep one until it expires
    private String token;
    private Instant tokenExpires = Instant.EPOCH;

    IgdbClient(ProviderHttp http, SettingsService settings) {
        this.http = http;
        this.settings = settings;
    }

    @Override
    public String provider() { return "igdb"; }

    @Override
    public boolean configured() {
        return settings.get(SettingsService.IGDB_CLIENT_ID) != null && settings.get(SettingsService.IGDB_CLIENT_SECRET) != null;
    }

    @Override
    public List<SearchHit> search(String query) throws Exception {
        String body = "search \"" + query.replace("\"", "") + "\"; fields name,first_release_date,cover.image_id,"
                + "involved_companies.developer,involved_companies.company.name; limit 10;";
        JsonNode list = http.send(http.request("https://api.igdb.com/v4/games")
                .header("Client-ID", settings.get(SettingsService.IGDB_CLIENT_ID))
                .header("Authorization", "Bearer " + token())
                .POST(HttpRequest.BodyPublishers.ofString(body)).build());
        List<SearchHit> hits = new ArrayList<>();
        for (JsonNode g : list) {
            String developer = null;
            for (JsonNode c : g.path("involved_companies")) {
                if (c.path("developer").asBoolean()) developer = c.path("company").path("name").asString();
            }
            Long released = g.path("first_release_date").isMissingNode() ? null : g.path("first_release_date").asLong();
            String cover = ProviderHttp.text(g.path("cover").path("image_id"));
            hits.add(new SearchHit("igdb", g.path("id").asString(), "game", ProviderHttp.text(g.path("name")),
                    released == null ? null : Instant.ofEpochSecond(released).atZone(ZoneOffset.UTC).getYear(),
                    developer, cover == null ? null : IMAGES + "t_cover_small/" + cover + ".jpg"));
        }
        return hits;
    }

    @Override
    public Fetched fetch(String kind, String externalId) throws Exception {
        // Links can be the numeric id or the slug from the game's igdb.com address
        String where = externalId.matches("\\d+") ? "id = " + externalId : "slug = \"" + externalId.replace("\"", "") + "\"";
        String query = "fields name,summary,total_rating,total_rating_count,first_release_date,cover.image_id,"
                + "artworks.image_id,genres.name,involved_companies.developer,involved_companies.company.name; where "
                + where + ";";
        JsonNode list = http.send(http.request("https://api.igdb.com/v4/games")
                .header("Client-ID", settings.get(SettingsService.IGDB_CLIENT_ID))
                .header("Authorization", "Bearer " + token())
                .POST(HttpRequest.BodyPublishers.ofString(query)).build());
        if (list.isEmpty()) throw new IllegalArgumentException("Not found on IGDB; check the linked id");
        JsonNode g = list.path(0);

        List<String> genres = new ArrayList<>();
        g.path("genres").forEach(x -> genres.add(x.path("name").asString()));
        String developer = null;
        for (JsonNode c : g.path("involved_companies")) {
            if (c.path("developer").asBoolean()) developer = c.path("company").path("name").asString();
        }
        Long released = g.path("first_release_date").isMissingNode() ? null : g.path("first_release_date").asLong();
        String cover = ProviderHttp.text(g.path("cover").path("image_id"));
        String artwork = ProviderHttp.text(g.path("artworks").path(0).path("image_id"));

        return new Fetched(
                ProviderHttp.text(g.path("name")), null, developer,
                released == null ? null : Instant.ofEpochSecond(released).atZone(ZoneOffset.UTC).getYear(), null,
                "Game", ProviderHttp.text(g.path("summary")), null, null, genres,
                cover == null ? null : IMAGES + "t_cover_big_2x/" + cover + ".jpg",
                artwork == null ? null : IMAGES + "t_1080p/" + artwork + ".jpg",
                ProviderHttp.number(g.path("total_rating")), 100,
                ProviderHttp.integer(g.path("total_rating_count")));
    }

    private JsonNode query(String endpoint, String body) throws Exception {
        return http.send(http.request("https://api.igdb.com/v4/" + endpoint)
                .header("Client-ID", settings.get(SettingsService.IGDB_CLIENT_ID))
                .header("Authorization", "Bearer " + token())
                .POST(HttpRequest.BodyPublishers.ofString(body)).build());
    }

    private static String where(String externalId) {
        return externalId.matches("\\d+") ? "id = " + externalId : "slug = \"" + externalId.replace("\"", "") + "\"";
    }

    @Override
    public List<FetchedCharacter> characters(String kind, String externalId) throws Exception {
        JsonNode game = query("games", "fields id; " + "where " + where(externalId) + ";").path(0);
        if (game.isMissingNode()) return List.of();
        JsonNode list = query("characters", "fields name,description,mug_shot.image_id; where games = ("
                + game.path("id").asString() + "); limit 50;");
        List<FetchedCharacter> out = new ArrayList<>();
        for (JsonNode c : list) {
            String mug = ProviderHttp.text(c.path("mug_shot").path("image_id"));
            out.add(new FetchedCharacter(c.path("id").asString(), ProviderHttp.text(c.path("name")), null, null,
                    ProviderHttp.text(c.path("description")), mug == null ? null : IMAGES + "t_cover_big_2x/" + mug + ".jpg",
                    null, null, null));
        }
        return out;
    }

    @Override
    public FetchedCharacter character(String characterId) throws Exception {
        JsonNode c = query("characters", "fields name,description,akas,mug_shot.image_id; where id = "
                + Long.parseLong(characterId) + ";").path(0);
        if (c.isMissingNode()) return null;
        java.util.Map<String, String> details = new java.util.LinkedHashMap<>();
        List<String> akas = new ArrayList<>();
        c.path("akas").forEach(a -> akas.add(a.asString()));
        if (!akas.isEmpty()) details.put("Also known as", String.join(", ", akas));
        String mug = ProviderHttp.text(c.path("mug_shot").path("image_id"));
        return new FetchedCharacter(characterId, ProviderHttp.text(c.path("name")), null, null,
                ProviderHttp.text(c.path("description")), mug == null ? null : IMAGES + "t_cover_big_2x/" + mug + ".jpg",
                null, null, details);
    }

    // IGDB reports each image's full size; t_original serves that size
    @Override
    public List<ImageOption> images(String kind, String externalId, String slot) throws Exception {
        boolean cover = slot.equals("cover");
        String fields = cover ? "cover.image_id,cover.width,cover.height"
                : "artworks.image_id,artworks.width,artworks.height,screenshots.image_id,screenshots.width,screenshots.height";
        JsonNode g = query("games", "fields " + fields + "; where " + where(externalId) + ";").path(0);
        List<ImageOption> options = new ArrayList<>();
        if (cover) addImage(options, g.path("cover"), "Cover");
        else {
            g.path("artworks").forEach(a -> addImage(options, a, "Artwork"));
            g.path("screenshots").forEach(a -> addImage(options, a, "Screenshot"));
        }
        return options;
    }

    private static void addImage(List<ImageOption> options, JsonNode image, String label) {
        String id = ProviderHttp.text(image.path("image_id"));
        if (id == null) return;
        options.add(new ImageOption("igdb", IMAGES + "t_original/" + id + ".jpg",
                ProviderHttp.integer(image.path("width")), ProviderHttp.integer(image.path("height")), label));
    }

    private synchronized String token() throws Exception {
        if (token != null && Instant.now().isBefore(tokenExpires)) return token;
        String url = "https://id.twitch.tv/oauth2/token?grant_type=client_credentials"
                + "&client_id=" + URLEncoder.encode(settings.get(SettingsService.IGDB_CLIENT_ID), StandardCharsets.UTF_8)
                + "&client_secret=" + URLEncoder.encode(settings.get(SettingsService.IGDB_CLIENT_SECRET), StandardCharsets.UTF_8);
        JsonNode res = http.send(http.request(url).POST(HttpRequest.BodyPublishers.noBody()).build());
        token = res.path("access_token").asString();
        // Renew a minute early
        tokenExpires = Instant.now().plusSeconds(res.path("expires_in").asLong() - 60);
        return token;
    }
}

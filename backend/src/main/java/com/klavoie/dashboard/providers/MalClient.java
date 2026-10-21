package com.klavoie.dashboard.providers;

import com.klavoie.dashboard.settings.SettingsService;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

// MyAnimeList. With a client id from myanimelist.net/apiconfig it uses the official API v2;
// without one it uses Jikan (api.jikan.moe), an open mirror of MAL's data.
// Episodes, characters and pictures always come from Jikan, since the official API doesn't have them.
@Component
class MalClient implements ProviderClient {

    private static final String FIELDS = "title,alternative_titles,synopsis,mean,num_scoring_users,main_picture,"
            + "start_date,end_date,media_type,num_episodes,average_episode_duration,num_volumes,genres,studios,"
            + "authors{first_name,last_name}";
    private static final String JIKAN = "https://api.jikan.moe/v4/";
    // Jikan allows about three requests a second
    private static final long JIKAN_GAP_MS = 400;

    private final ProviderHttp http;
    private final SettingsService settings;
    private long lastJikanCall;

    MalClient(ProviderHttp http, SettingsService settings) {
        this.http = http;
        this.settings = settings;
    }

    @Override
    public String provider() { return "myanimelist"; }

    // Jikan needs no key, so MyAnimeList always works
    @Override
    public boolean configured() { return true; }

    private boolean hasKey() { return settings.get(SettingsService.MAL_CLIENT_ID) != null; }

    private JsonNode official(String path) throws Exception {
        return http.send(http.request("https://api.myanimelist.net/v2/" + path)
                .header("X-MAL-CLIENT-ID", settings.get(SettingsService.MAL_CLIENT_ID)).GET().build());
    }

    private synchronized JsonNode jikan(String path) throws Exception {
        long wait = lastJikanCall + JIKAN_GAP_MS - System.currentTimeMillis();
        if (wait > 0) Thread.sleep(wait);
        try {
            return http.get(JIKAN + path);
        } finally {
            lastJikanCall = System.currentTimeMillis();
        }
    }

    private static String section(String kind) { return kind.equals("anime") || kind.equals("movie") ? "anime" : "manga"; }

    @Override
    public List<SearchHit> search(String query) throws Exception {
        List<SearchHit> hits = new ArrayList<>();
        for (String section : List.of("anime", "manga")) {
            if (hasKey()) {
                for (JsonNode item : official(section + "?limit=6&fields=start_date,media_type&q=" + ProviderHttp.encode(query)).path("data")) {
                    JsonNode n = item.path("node");
                    String type = ProviderHttp.text(n.path("media_type"));
                    hits.add(new SearchHit("myanimelist", n.path("id").asString(), kindOf(section, type),
                            ProviderHttp.text(n.path("title")), ProviderHttp.year(ProviderHttp.text(n.path("start_date"))),
                            type == null ? null : type.replace('_', ' '), ProviderHttp.text(n.path("main_picture").path("medium"))));
                }
            } else {
                for (JsonNode n : jikan(section + "?limit=6&sfw=true&q=" + ProviderHttp.encode(query)).path("data")) {
                    String type = ProviderHttp.text(n.path("type"));
                    hits.add(new SearchHit("myanimelist", n.path("mal_id").asString(),
                            kindOf(section, type == null ? null : type.toLowerCase().replace(' ', '_')),
                            englishOr(n), ProviderHttp.integer(n.path(section.equals("anime") ? "aired" : "published").path("prop").path("from").path("year")),
                            type, ProviderHttp.text(n.path("images").path("jpg").path("image_url"))));
                }
            }
        }
        return hits;
    }

    private static String kindOf(String section, String type) {
        if (section.equals("anime")) return "movie".equals(type) ? "movie" : "anime";
        return "light_novel".equals(type) || "novel".equals(type) ? "light-novel" : "manga";
    }

    private static String englishOr(JsonNode n) {
        String english = ProviderHttp.text(n.path("title_english"));
        return english != null && !english.isBlank() ? english : ProviderHttp.text(n.path("title"));
    }

    @Override
    public Fetched fetch(String kind, String externalId) throws Exception {
        int id = Integer.parseInt(externalId);
        return hasKey() ? fetchOfficial(kind, id) : fetchJikan(kind, id);
    }

    private Fetched fetchOfficial(String kind, int id) throws Exception {
        boolean anime = section(kind).equals("anime");
        JsonNode m = official(section(kind) + "/" + id + "?fields="
                // The braces in authors{...} aren't allowed raw in a URL
                + ProviderHttp.encode(FIELDS));
        List<String> genres = new ArrayList<>();
        m.path("genres").forEach(g -> genres.add(g.path("name").asString()));
        String creator = anime ? ProviderHttp.text(m.path("studios").path(0).path("name")) : officialAuthors(m.path("authors"));
        Integer seconds = ProviderHttp.integer(m.path("average_episode_duration"));
        String english = ProviderHttp.text(m.path("alternative_titles").path("en"));
        return new Fetched(
                english != null && !english.isBlank() ? english : ProviderHttp.text(m.path("title")),
                ProviderHttp.text(m.path("alternative_titles").path("ja")),
                creator,
                ProviderHttp.year(ProviderHttp.text(m.path("start_date"))),
                ProviderHttp.year(ProviderHttp.text(m.path("end_date"))),
                ProviderHttp.text(m.path("media_type")),
                ProviderHttp.text(m.path("synopsis")),
                ProviderHttp.number(m.path(anime ? "num_episodes" : "num_volumes")),
                seconds == null || seconds == 0 ? null : Math.round(seconds / 60f),
                genres,
                ProviderHttp.text(m.path("main_picture").path("large")),
                null,
                ProviderHttp.number(m.path("mean")), 10,
                ProviderHttp.integer(m.path("num_scoring_users")));
    }

    private Fetched fetchJikan(String kind, int id) throws Exception {
        boolean anime = section(kind).equals("anime");
        JsonNode m = jikan(section(kind) + "/" + id + "/full").path("data");
        List<String> genres = new ArrayList<>();
        m.path("genres").forEach(g -> genres.add(g.path("name").asString()));
        List<String> authors = new ArrayList<>();
        m.path("authors").forEach(a -> authors.add(flipName(a.path("name").asString())));
        String dates = anime ? "aired" : "published";
        return new Fetched(
                englishOr(m),
                ProviderHttp.text(m.path("title_japanese")),
                anime ? ProviderHttp.text(m.path("studios").path(0).path("name")) : authors.isEmpty() ? null : String.join(" · ", authors),
                ProviderHttp.integer(m.path(dates).path("prop").path("from").path("year")),
                ProviderHttp.integer(m.path(dates).path("prop").path("to").path("year")),
                ProviderHttp.text(m.path("type")),
                ProviderHttp.text(m.path("synopsis")),
                ProviderHttp.number(m.path(anime ? "episodes" : "volumes")),
                anime ? minutes(ProviderHttp.text(m.path("duration"))) : null,
                genres,
                ProviderHttp.text(m.path("images").path("jpg").path("large_image_url")),
                null,
                ProviderHttp.number(m.path("score")), 10,
                ProviderHttp.integer(m.path("scored_by")));
    }

    // Jikan pages episodes 100 at a time; episode scores are out of 5
    @Override
    public List<FetchedEpisode> episodes(String kind, String externalId) throws Exception {
        if (!kind.equals("anime")) return List.of();
        List<FetchedEpisode> episodes = new ArrayList<>();
        for (int page = 1; page <= 20; page++) {
            JsonNode res = jikan("anime/" + Integer.parseInt(externalId) + "/episodes?page=" + page);
            for (JsonNode e : res.path("data")) {
                Double score = ProviderHttp.number(e.path("score"));
                episodes.add(new FetchedEpisode(e.path("mal_id").asInt(), null, null, ProviderHttp.text(e.path("title")),
                        date(ProviderHttp.text(e.path("aired"))), null, null, score == null ? null : score * 2, null));
            }
            if (!res.path("pagination").path("has_next_page").asBoolean()) break;
        }
        return episodes;
    }

    @Override
    public FetchedEpisode episode(String kind, String externalId, FetchedEpisode known) throws Exception {
        if (!kind.equals("anime")) return null;
        JsonNode e = jikan("anime/" + Integer.parseInt(externalId) + "/episodes/" + known.number()).path("data");
        Integer seconds = ProviderHttp.integer(e.path("duration"));
        return new FetchedEpisode(known.number(), null, null, ProviderHttp.text(e.path("title")),
                date(ProviderHttp.text(e.path("aired"))), seconds == null ? null : Math.round(seconds / 60f),
                ProviderHttp.text(e.path("synopsis")), null, null);
    }

    @Override
    public List<FetchedCharacter> characters(String kind, String externalId) throws Exception {
        boolean anime = section(kind).equals("anime");
        List<FetchedCharacter> cast = new ArrayList<>();
        for (JsonNode entry : jikan(section(kind) + "/" + Integer.parseInt(externalId) + "/characters").path("data")) {
            JsonNode c = entry.path("character");
            // Japanese voice actors first, as anime credits usually list them
            JsonNode voice = null;
            for (JsonNode va : entry.path("voice_actors")) {
                if (voice == null || "Japanese".equals(va.path("language").asString())) voice = va;
                if ("Japanese".equals(va.path("language").asString())) break;
            }
            cast.add(new FetchedCharacter(c.path("mal_id").asString(), flipName(c.path("name").asString()), null,
                    entry.path("role").asString().toUpperCase(), null,
                    ProviderHttp.text(c.path("images").path("jpg").path("image_url")),
                    anime && voice != null ? flipName(voice.path("person").path("name").asString()) : null,
                    anime && voice != null ? voice.path("language").asString() : null, null));
        }
        return cast;
    }

    @Override
    public FetchedCharacter character(String characterId) throws Exception {
        JsonNode c = jikan("characters/" + Integer.parseInt(characterId) + "/full").path("data");
        Map<String, String> details = new LinkedHashMap<>();
        List<String> nicknames = new ArrayList<>();
        c.path("nicknames").forEach(n -> nicknames.add(n.asString()));
        if (!nicknames.isEmpty()) details.put("Also known as", String.join(", ", nicknames));
        return new FetchedCharacter(characterId, flipName(c.path("name").asString()), ProviderHttp.text(c.path("name_kanji")),
                null, ProviderHttp.text(c.path("about")), ProviderHttp.text(c.path("images").path("jpg").path("image_url")),
                null, null, details);
    }

    // MAL only has posters; sizes are measured by the server
    @Override
    public List<ImageOption> images(String kind, String externalId, String slot) throws Exception {
        if (!slot.equals("cover")) return List.of();
        List<ImageOption> options = new ArrayList<>();
        for (JsonNode p : jikan(section(kind) + "/" + Integer.parseInt(externalId) + "/pictures").path("data")) {
            String url = ProviderHttp.text(p.path("jpg").path("large_image_url"));
            if (url != null) options.add(new ImageOption("myanimelist", url, null, null, "Poster"));
        }
        return options;
    }

    private static String officialAuthors(JsonNode list) {
        List<String> names = new ArrayList<>();
        list.forEach(a -> names.add((a.path("node").path("first_name").asString() + " "
                + a.path("node").path("last_name").asString()).trim()));
        return names.isEmpty() ? null : String.join(" · ", names);
    }

    // MAL lists people and characters as "Last, First"
    static String flipName(String name) {
        if (name == null) return null;
        int comma = name.indexOf(", ");
        return comma < 0 ? name : name.substring(comma + 2) + " " + name.substring(0, comma);
    }

    // "24 min per ep" -> 24, "1 hr 54 min" -> 114
    static Integer minutes(String duration) {
        if (duration == null) return null;
        var hours = java.util.regex.Pattern.compile("(\\d+) hr").matcher(duration);
        var mins = java.util.regex.Pattern.compile("(\\d+) min").matcher(duration);
        int total = (hours.find() ? Integer.parseInt(hours.group(1)) * 60 : 0) + (mins.find() ? Integer.parseInt(mins.group(1)) : 0);
        return total == 0 ? null : total;
    }

    // "2023-09-29T00:00:00+00:00" -> "2023-09-29"
    private static String date(String timestamp) {
        return timestamp == null || timestamp.length() < 10 ? null : timestamp.substring(0, 10);
    }
}

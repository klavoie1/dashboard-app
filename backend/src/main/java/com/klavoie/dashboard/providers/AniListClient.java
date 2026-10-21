package com.klavoie.dashboard.providers;

import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;

import java.net.http.HttpRequest;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

// AniList's GraphQL API is open, no key needed. Rate limit is about 90 requests a minute.
@Component
class AniListClient implements ProviderClient {

    private static final String QUERY = """
            query ($id: Int, $type: MediaType) {
              Media(id: $id, type: $type) {
                title { romaji english native }
                description
                format
                startDate { year }
                endDate { year }
                episodes duration volumes chapters
                genres
                averageScore
                stats { scoreDistribution { amount } }
                coverImage { extraLarge }
                bannerImage
                studios(isMain: true) { nodes { name } }
              }
            }""";

    private static final String SEARCH = """
            query ($search: String) {
              Page(perPage: 10) {
                media(search: $search, sort: SEARCH_MATCH) {
                  id type format
                  title { romaji english }
                  startDate { year }
                  coverImage { medium }
                  studios(isMain: true) { nodes { name } }
                }
              }
            }""";

    // AniList has no episode list, but airing dates and streaming titles cover most shows
    private static final String EPISODES = """
            query ($id: Int) {
              Media(id: $id, type: ANIME) {
                duration
                streamingEpisodes { title }
                airingSchedule(perPage: 50) { nodes { episode airingAt } }
              }
            }""";

    private static final String CHARACTERS = """
            query ($id: Int, $type: MediaType, $page: Int) {
              Media(id: $id, type: $type) {
                characters(sort: [ROLE, RELEVANCE, ID], perPage: 25, page: $page) {
                  pageInfo { hasNextPage }
                  edges {
                    role
                    node { id name { full native } image { large } }
                    voiceActors(language: JAPANESE, sort: [RELEVANCE, ID]) { name { full } }
                  }
                }
              }
            }""";

    private static final String CHARACTER = """
            query ($id: Int) {
              Character(id: $id) {
                name { full native alternative }
                description
                image { large }
                gender age bloodType
                dateOfBirth { month day }
              }
            }""";

    private static final String IMAGES = """
            query ($id: Int, $type: MediaType) {
              Media(id: $id, type: $type) { coverImage { extraLarge large } bannerImage }
            }""";

    private static final String CARD = "id type format title { english romaji } startDate { year } coverImage { large } studios(isMain: true) { nodes { name } }";

    private static final String SIMILAR = """
            query ($id: Int, $type: MediaType) {
              Media(id: $id, type: $type) {
                recommendations(sort: RATING_DESC, perPage: 12) { nodes { mediaRecommendation { %s } } }
              }
            }""".formatted(CARD);

    private static final String TRENDING = """
            query ($type: MediaType) {
              Page(perPage: 12) { media(sort: TRENDING_DESC, type: $type, isAdult: false) { %s } }
            }""".formatted(CARD);

    // AniList hides spoilers as ~!text!~; those are left out so pages stay spoiler-free
    private static final java.util.regex.Pattern SPOILER = java.util.regex.Pattern.compile("~!.*?!~", java.util.regex.Pattern.DOTALL);

    private static final java.util.regex.Pattern EPISODE_TITLE =
            java.util.regex.Pattern.compile("^Episode (\\d+)\\s*[-–:]\\s*(.+)$");

    private final ProviderHttp http;

    AniListClient(ProviderHttp http) { this.http = http; }

    @Override
    public String provider() { return "anilist"; }

    @Override
    public boolean configured() { return true; }

    @Override
    public List<SearchHit> search(String query) throws Exception {
        JsonNode list = post(Map.of("query", SEARCH, "variables", Map.of("search", query))).path("Page").path("media");
        List<SearchHit> hits = new ArrayList<>();
        for (JsonNode m : list) {
            String format = ProviderHttp.text(m.path("format"));
            String kind = "ANIME".equals(m.path("type").asString())
                    ? ("MOVIE".equals(format) ? "movie" : "anime")
                    : ("NOVEL".equals(format) ? "light-novel" : "manga");
            String english = ProviderHttp.text(m.path("title").path("english"));
            hits.add(new SearchHit("anilist", m.path("id").asString(), kind,
                    english != null ? english : ProviderHttp.text(m.path("title").path("romaji")),
                    ProviderHttp.integer(m.path("startDate").path("year")),
                    ProviderHttp.text(m.path("studios").path("nodes").path(0).path("name")),
                    ProviderHttp.text(m.path("coverImage").path("medium"))));
        }
        return hits;
    }

    @Override
    public List<FetchedEpisode> episodes(String kind, String externalId) throws Exception {
        if (!kind.equals("anime")) return List.of();
        JsonNode m = post(Map.of("query", EPISODES, "variables", Map.of("id", Integer.parseInt(externalId)))).path("Media");
        Integer minutes = ProviderHttp.integer(m.path("duration"));
        Map<Integer, String> titles = new java.util.HashMap<>();
        for (JsonNode e : m.path("streamingEpisodes")) {
            var match = EPISODE_TITLE.matcher(e.path("title").asString());
            if (match.matches()) titles.putIfAbsent(Integer.parseInt(match.group(1)), match.group(2).trim());
        }
        Map<Integer, String> aired = new java.util.HashMap<>();
        for (JsonNode n : m.path("airingSchedule").path("nodes")) {
            aired.put(n.path("episode").asInt(), java.time.Instant.ofEpochSecond(n.path("airingAt").asLong())
                    .atZone(java.time.ZoneOffset.UTC).toLocalDate().toString());
        }
        int count = java.util.stream.Stream.concat(titles.keySet().stream(), aired.keySet().stream())
                .mapToInt(Integer::intValue).max().orElse(0);
        List<FetchedEpisode> episodes = new ArrayList<>();
        for (int n = 1; n <= count; n++) {
            episodes.add(new FetchedEpisode(n, null, null, titles.get(n), aired.get(n), minutes, null, null, null));
        }
        return episodes;
    }

    @Override
    public List<FetchedCharacter> characters(String kind, String externalId) throws Exception {
        List<FetchedCharacter> cast = new ArrayList<>();
        String type = kind.equals("anime") || kind.equals("movie") ? "ANIME" : "MANGA";
        // Up to 100 characters, which covers even long-running shows' main casts
        for (int page = 1; page <= 4; page++) {
            JsonNode chars = post(Map.of("query", CHARACTERS, "variables",
                    Map.of("id", Integer.parseInt(externalId), "type", type, "page", page))).path("Media").path("characters");
            for (JsonNode edge : chars.path("edges")) {
                JsonNode n = edge.path("node");
                JsonNode voice = edge.path("voiceActors").path(0);
                cast.add(new FetchedCharacter(n.path("id").asString(), ProviderHttp.text(n.path("name").path("full")),
                        ProviderHttp.text(n.path("name").path("native")), ProviderHttp.text(edge.path("role")), null,
                        ProviderHttp.text(n.path("image").path("large")),
                        voice.isMissingNode() ? null : ProviderHttp.text(voice.path("name").path("full")),
                        voice.isMissingNode() ? null : "Japanese", null));
            }
            if (!chars.path("pageInfo").path("hasNextPage").asBoolean()) break;
        }
        return cast;
    }

    @Override
    public FetchedCharacter character(String characterId) throws Exception {
        JsonNode c = post(Map.of("query", CHARACTER, "variables", Map.of("id", Integer.parseInt(characterId)))).path("Character");
        Map<String, String> details = new java.util.LinkedHashMap<>();
        List<String> alternative = new ArrayList<>();
        c.path("name").path("alternative").forEach(a -> { if (!a.asString().isBlank()) alternative.add(a.asString()); });
        if (!alternative.isEmpty()) details.put("Also known as", String.join(", ", alternative));
        putIf(details, "Gender", ProviderHttp.text(c.path("gender")));
        putIf(details, "Age", ProviderHttp.text(c.path("age")));
        Integer month = ProviderHttp.integer(c.path("dateOfBirth").path("month"));
        Integer day = ProviderHttp.integer(c.path("dateOfBirth").path("day"));
        if (month != null && day != null) {
            details.put("Birthday", java.time.Month.of(month).getDisplayName(java.time.format.TextStyle.FULL, java.util.Locale.ENGLISH) + " " + day);
        }
        putIf(details, "Blood type", ProviderHttp.text(c.path("bloodType")));
        String about = ProviderHttp.text(c.path("description"));
        if (about != null) about = ProviderHttp.plain(ProviderHttp.markdown(SPOILER.matcher(about).replaceAll("")));
        return new FetchedCharacter(characterId, ProviderHttp.text(c.path("name").path("full")),
                ProviderHttp.text(c.path("name").path("native")), null, about,
                ProviderHttp.text(c.path("image").path("large")), null, null, details);
    }

    @Override
    public List<SearchHit> similar(String kind, String externalId) throws Exception {
        String type = kind.equals("anime") || kind.equals("movie") ? "ANIME" : "MANGA";
        List<SearchHit> out = new ArrayList<>();
        for (JsonNode n : post(Map.of("query", SIMILAR, "variables", Map.of("id", Integer.parseInt(externalId), "type", type)))
                .path("Media").path("recommendations").path("nodes")) {
            if (!n.path("mediaRecommendation").isNull()) out.add(card(n.path("mediaRecommendation")));
        }
        return out;
    }

    @Override
    public List<Shelf> trending() throws Exception {
        List<Shelf> shelves = new ArrayList<>();
        for (String type : List.of("ANIME", "MANGA")) {
            List<SearchHit> items = new ArrayList<>();
            post(Map.of("query", TRENDING, "variables", Map.of("type", type))).path("Page").path("media").forEach(m -> items.add(card(m)));
            shelves.add(new Shelf("anilist-trending-" + type.toLowerCase(), type.equals("ANIME") ? "Trending anime" : "Trending manga",
                    "What people are watching and reading on AniList this week", items));
        }
        return shelves;
    }

    private static SearchHit card(JsonNode m) {
        String format = ProviderHttp.text(m.path("format"));
        String kind = "ANIME".equals(m.path("type").asString())
                ? ("MOVIE".equals(format) ? "movie" : "anime")
                : ("NOVEL".equals(format) ? "light-novel" : "manga");
        String english = ProviderHttp.text(m.path("title").path("english"));
        return new SearchHit("anilist", m.path("id").asString(), kind,
                english != null ? english : ProviderHttp.text(m.path("title").path("romaji")),
                ProviderHttp.integer(m.path("startDate").path("year")),
                ProviderHttp.text(m.path("studios").path("nodes").path(0).path("name")),
                ProviderHttp.text(m.path("coverImage").path("large")));
    }

    private static void putIf(Map<String, String> map, String label, String value) {
        if (value != null && !value.isBlank()) map.put(label, value);
    }

    // AniList has one cover and one banner per title; the server measures them
    @Override
    public List<ImageOption> images(String kind, String externalId, String slot) throws Exception {
        String type = kind.equals("anime") || kind.equals("movie") ? "ANIME" : "MANGA";
        JsonNode m = post(Map.of("query", IMAGES, "variables", Map.of("id", Integer.parseInt(externalId), "type", type))).path("Media");
        String url = slot.equals("cover") ? ProviderHttp.text(m.path("coverImage").path("extraLarge")) : ProviderHttp.text(m.path("bannerImage"));
        return url == null ? List.of() : List.of(new ImageOption("anilist", url, null, null, slot.equals("cover") ? "Cover" : "Banner"));
    }

    private JsonNode post(Map<String, Object> body) throws Exception {
        return http.send(http.request("https://graphql.anilist.co")
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(http.body(body))).build()).path("data");
    }

    @Override
    public Fetched fetch(String kind, String externalId) throws Exception {
        boolean anime = kind.equals("anime");
        JsonNode m = post(Map.of("query", QUERY,
                "variables", Map.of("id", Integer.parseInt(externalId), "type", anime ? "ANIME" : "MANGA"))).path("Media");

        // There's no vote count field, so add up the score distribution
        int votes = 0;
        for (JsonNode bucket : m.path("stats").path("scoreDistribution")) votes += bucket.path("amount").asInt();
        List<String> genres = new ArrayList<>();
        m.path("genres").forEach(g -> genres.add(g.asString()));
        String english = ProviderHttp.text(m.path("title").path("english"));
        JsonNode studio = m.path("studios").path("nodes").path(0).path("name");

        return new Fetched(
                english != null ? english : ProviderHttp.text(m.path("title").path("romaji")),
                ProviderHttp.text(m.path("title").path("native")),
                ProviderHttp.text(studio),
                ProviderHttp.integer(m.path("startDate").path("year")),
                ProviderHttp.integer(m.path("endDate").path("year")),
                ProviderHttp.text(m.path("format")),
                ProviderHttp.plain(ProviderHttp.text(m.path("description"))),
                ProviderHttp.number(m.path(anime ? "episodes" : "volumes")),
                anime ? ProviderHttp.integer(m.path("duration")) : null,
                genres,
                ProviderHttp.text(m.path("coverImage").path("extraLarge")),
                ProviderHttp.text(m.path("bannerImage")),
                ProviderHttp.number(m.path("averageScore")), 100, votes);
    }
}

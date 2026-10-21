package com.klavoie.dashboard.providers;

import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

// Open Library for books: details, authors, page counts, covers and reader ratings. No key needed.
// Ids are work keys like OL82563W.
@Component
class OpenLibraryClient implements ProviderClient {

    private static final String API = "https://openlibrary.org/";
    private static final String COVERS = "https://covers.openlibrary.org/b/id/";
    private static final Pattern YEAR = Pattern.compile("(\\d{4})");

    private final ProviderHttp http;

    OpenLibraryClient(ProviderHttp http) { this.http = http; }

    @Override
    public String provider() { return "openlibrary"; }

    @Override
    public boolean configured() { return true; }

    private static String workId(String externalId) {
        String id = externalId.trim().replaceAll("^/?works/", "");
        if (!id.matches("OL\\d+W")) throw new IllegalArgumentException("Open Library ids look like OL82563W");
        return id;
    }

    @Override
    public List<SearchHit> search(String query) throws Exception {
        JsonNode docs = http.get(API + "search.json?limit=10&fields=key,title,author_name,first_publish_year,cover_i&q="
                + ProviderHttp.encode(query)).path("docs");
        List<SearchHit> hits = new ArrayList<>();
        for (JsonNode d : docs) {
            String cover = ProviderHttp.text(d.path("cover_i"));
            hits.add(new SearchHit("openlibrary", d.path("key").asString().replace("/works/", ""), "book",
                    ProviderHttp.text(d.path("title")), ProviderHttp.integer(d.path("first_publish_year")),
                    ProviderHttp.text(d.path("author_name").path(0)), cover == null ? null : COVERS + cover + "-M.jpg"));
        }
        return hits;
    }

    @Override
    public Fetched fetch(String kind, String externalId) throws Exception {
        String id = workId(externalId);
        JsonNode w = http.get(API + "works/" + id + ".json");
        // Descriptions are either plain text or {"type": ..., "value": ...}
        JsonNode description = w.path("description");
        String about = description.isObject() ? ProviderHttp.text(description.path("value")) : ProviderHttp.text(description);
        // Descriptions often end with a "----------" line and a list of editions and links; only the description is kept
        if (about != null) about = ProviderHttp.markdown(about.split("\\n?\\s*-{3,}")[0]).trim();
        List<String> subjects = new ArrayList<>();
        for (JsonNode s : w.path("subjects")) {
            if (subjects.size() == 6) break;
            subjects.add(s.asString());
        }
        String authorKey = ProviderHttp.text(w.path("authors").path(0).path("author").path("key"));
        String author = authorKey == null ? null : ProviderHttp.text(http.get(API + authorKey.substring(1) + ".json").path("name"));
        JsonNode edition = http.get(API + "works/" + id + "/editions.json?limit=5").path("entries");
        Double pages = null;
        for (JsonNode e : edition) {
            if (e.has("number_of_pages")) { pages = e.path("number_of_pages").asDouble(); break; }
        }
        JsonNode ratings = http.get(API + "works/" + id + "/ratings.json").path("summary");
        Double average = ProviderHttp.number(ratings.path("average"));
        String cover = ProviderHttp.text(w.path("covers").path(0));
        return new Fetched(ProviderHttp.text(w.path("title")), null, author, year(ProviderHttp.text(w.path("first_publish_date"))),
                null, "Book", about, pages, null, subjects, cover == null ? null : COVERS + cover + "-L.jpg", null,
                // Ratings are out of 5; doubled to fit the 10-point scale
                average == null ? null : Math.round(average * 20) / 10.0, 10, ProviderHttp.integer(ratings.path("count")));
    }

    // More books on the work's main subject
    @Override
    public List<SearchHit> similar(String kind, String externalId) throws Exception {
        String subject = ProviderHttp.text(http.get(API + "works/" + workId(externalId) + ".json").path("subjects").path(0));
        if (subject == null) return List.of();
        String slug = subject.toLowerCase().replaceAll("[^a-z0-9]+", "_").replaceAll("^_|_$", "");
        List<SearchHit> out = new ArrayList<>();
        for (JsonNode w : http.get(API + "subjects/" + slug + ".json?limit=14").path("works")) {
            String cover = ProviderHttp.text(w.path("cover_id"));
            out.add(new SearchHit("openlibrary", w.path("key").asString().replace("/works/", ""), "book", ProviderHttp.text(w.path("title")),
                    ProviderHttp.integer(w.path("first_publish_year")), ProviderHttp.text(w.path("authors").path(0).path("name")),
                    cover == null ? null : COVERS + cover + "-M.jpg"));
        }
        return out;
    }

    // Every cover scan Open Library has; the server measures their sizes
    @Override
    public List<ImageOption> images(String kind, String externalId, String slot) throws Exception {
        if (!slot.equals("cover")) return List.of();
        List<ImageOption> options = new ArrayList<>();
        for (JsonNode c : http.get(API + "works/" + workId(externalId) + ".json").path("covers")) {
            if (c.asLong() <= 0) continue;
            options.add(new ImageOption("openlibrary", COVERS + c.asString() + "-L.jpg", null, null, "Cover"));
            if (options.size() == 10) break;
        }
        return options;
    }

    private static Integer year(String text) {
        if (text == null) return null;
        Matcher m = YEAR.matcher(text);
        return m.find() ? Integer.valueOf(m.group(1)) : null;
    }
}

package com.klavoie.dashboard.providers;

import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.regex.Pattern;

// Shared HTTP plumbing so every provider call has the same timeouts and error messages.
@Component
public class ProviderHttp {

    private static final Pattern TAGS = Pattern.compile("<[^>]+>");

    private final HttpClient client = HttpClient.newBuilder()
            // Short, so a source that is down only briefly delays search
            .connectTimeout(Duration.ofSeconds(4))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();
    private final ObjectMapper json;

    ProviderHttp(ObjectMapper json) { this.json = json; }

    HttpRequest.Builder request(String url) {
        return HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(20))
                .header("Accept", "application/json")
                .header("User-Agent", "Keeper (self-hosted media tracker)");
    }

    JsonNode send(HttpRequest request) throws IOException, InterruptedException {
        HttpResponse<String> res = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (res.statusCode() == 404) throw new IOException("Not found on the provider; check the linked id");
        if (res.statusCode() == 401 || res.statusCode() == 403) throw new IOException("The provider rejected the API key");
        if (res.statusCode() == 429) throw new IOException("Rate limited by the provider; try again in a minute");
        if (res.statusCode() >= 400) throw new IOException("Provider answered " + res.statusCode());
        return json.readTree(res.body());
    }

    public HttpResponse<byte[]> download(String url) throws IOException, InterruptedException {
        return client.send(request(url).header("Accept", "image/*").build(), HttpResponse.BodyHandlers.ofByteArray());
    }

    JsonNode get(String url) throws IOException, InterruptedException {
        return send(request(url).GET().build());
    }

    static String encode(String value) {
        return java.net.URLEncoder.encode(value, java.nio.charset.StandardCharsets.UTF_8);
    }

    String body(Object value) {
        return json.writeValueAsString(value);
    }

    // Provider descriptions often carry HTML line breaks and tags
    static String plain(String html) {
        if (html == null || html.isBlank()) return null;
        return TAGS.matcher(html.replaceAll("(?i)<br\\s*/?>", "\n")).replaceAll("").replaceAll("\n{3,}", "\n\n").trim();
    }

    // Some sources write descriptions in Markdown: [text](link), __bold__, **bold**, _italic_
    static String markdown(String text) {
        if (text == null) return null;
        return text.replaceAll("\\[([^\\]]+)]\\([^)]*\\)", "$1")
                .replace("__", "").replace("**", "")
                .replaceAll("(?<![\\w*])_([^_\\n]+)_(?![\\w*])", "$1")
                .replace("\\[", "[").replace("\\]", "]");
    }

    static String text(JsonNode node) {
        return node == null || node.isMissingNode() || node.isNull() ? null : node.asString();
    }

    static Integer integer(JsonNode node) {
        return node == null || node.isMissingNode() || node.isNull() ? null : node.asInt();
    }

    static Double number(JsonNode node) {
        return node == null || node.isMissingNode() || node.isNull() ? null : node.asDouble();
    }

    // "2023-09-29" -> 2023
    static Integer year(String date) {
        return date == null || date.length() < 4 ? null : Integer.valueOf(date.substring(0, 4));
    }
}

package com.klavoie.dashboard.media;

import com.klavoie.dashboard.providers.ProviderHttp;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

// Keeps every cover and backdrop on this server, so pages never load images from a provider.
@Service
public class ArtworkService {

    public static final long MAX_BYTES = 15 * 1024 * 1024;
    // Only provider image hosts, so an address from the browser can't make the server fetch anything else
    static final java.util.Set<String> PROVIDER_HOSTS = java.util.Set.of(
            "s4.anilist.co", "cdn.myanimelist.net", "image.tmdb.org", "images.igdb.com",
            "static.tvmaze.com", "covers.openlibrary.org", "media.kitsu.app", "media.kitsu.io",
            "uploads.mangadex.org", "assets.fanart.tv");

    public static boolean isProviderImage(String url) {
        if (url == null) return false;
        try {
            java.net.URI uri = java.net.URI.create(url);
            return "https".equals(uri.getScheme()) && PROVIDER_HOSTS.contains(uri.getHost());
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/jpeg", "jpg", "image/png", "png", "image/webp", "webp", "image/gif", "gif");

    private final Path root;
    private final ProviderHttp http;

    ArtworkService(@Value("${app.media-root}") String root, ProviderHttp http) {
        this.root = Path.of(root);
        this.http = http;
    }

    // Downloads a provider image; returns the path the page can load it from
    String download(Long mediaId, String slot, String url) throws IOException, InterruptedException {
        Downloaded image = fetch(url);
        return save(mediaId, slot, image.contentType(), image.bytes());
    }

    String save(Long mediaId, String slot, String contentType, byte[] bytes) throws IOException {
        return store("artwork", mediaId + "-" + slot, contentType, bytes);
    }

    public record Downloaded(String contentType, byte[] bytes) {}

    public Downloaded fetch(String url) throws IOException, InterruptedException {
        if (!isProviderImage(url)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Not a provider image");
        HttpResponse<byte[]> res = http.download(url);
        if (res.statusCode() >= 400) throw new IOException("Image download failed (" + res.statusCode() + ")");
        return new Downloaded(res.headers().firstValue("Content-Type").orElse("").split(";")[0].trim(), res.body());
    }

    // Saves under MEDIA_ROOT/folder/name.ext, replacing older formats of the same name.
    // Returns the address pages load it from; the version stops browsers showing a cached older image.
    public String store(String folder, String name, String contentType, byte[] bytes) throws IOException {
        String ext = EXTENSIONS.get(contentType);
        if (ext == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Not a supported image type: " + contentType);
        if (bytes.length > MAX_BYTES) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image is over 15 MB");
        Path dir = root.resolve(folder);
        Files.createDirectories(dir);
        for (String other : EXTENSIONS.values()) Files.deleteIfExists(dir.resolve(name + "." + other));
        Files.write(dir.resolve(name + "." + ext), bytes);
        return "/media/" + folder + "/" + name + "." + ext + "?v=" + System.currentTimeMillis();
    }

    // Removes a stored image given the address store() returned; other addresses are ignored
    public void remove(String path) throws IOException {
        if (path == null || !path.startsWith("/media/")) return;
        Path file = root.resolve(path.substring("/media/".length()).split("\\?")[0]).normalize();
        if (file.startsWith(root.normalize())) Files.deleteIfExists(file);
    }
}

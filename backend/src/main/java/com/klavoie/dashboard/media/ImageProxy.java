package com.klavoie.dashboard.media;

import com.klavoie.dashboard.providers.ProviderHttp;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.net.http.HttpResponse;
import java.time.Duration;

// Search thumbnails come through the server, so browsing results never contacts a provider from the browser.
// Only provider image hosts are allowed, so this can't be used to fetch arbitrary addresses.
@RestController
class ImageProxy {

    private final ProviderHttp http;

    ImageProxy(ProviderHttp http) { this.http = http; }

    @GetMapping("/api/images")
    ResponseEntity<byte[]> image(@RequestParam String url) throws Exception {
        if (!ArtworkService.isProviderImage(url)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Not a provider image");
        }
        HttpResponse<byte[]> res = http.download(url);
        String type = res.headers().firstValue("Content-Type").orElse("");
        if (res.statusCode() >= 400 || !type.startsWith("image/") || res.body().length > ArtworkService.MAX_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Image unavailable");
        }
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(type))
                .cacheControl(CacheControl.maxAge(Duration.ofDays(7)).cachePrivate())
                .body(res.body());
    }
}

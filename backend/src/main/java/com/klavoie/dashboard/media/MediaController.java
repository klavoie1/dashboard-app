package com.klavoie.dashboard.media;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/media")
class MediaController {

    private final MediaService service;
    private final RefreshService refresh;
    private final ArtworkService artwork;
    private final SearchService search;
    private final EpisodeDetails episodes;
    private final DiscoverService discover;

    MediaController(MediaService service, RefreshService refresh, ArtworkService artwork, SearchService search,
                    EpisodeDetails episodes, DiscoverService discover) {
        this.discover = discover;
        this.episodes = episodes;
        this.service = service;
        this.refresh = refresh;
        this.artwork = artwork;
        this.search = search;
    }

    // Searches every configured provider; results already in the library carry their mediaId
    @GetMapping("/search")
    SearchResponse search(@RequestParam String q) {
        if (q.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Search for something");
        return search.search(q.trim());
    }

    // Suggestion shelves for the Discover page; refresh=true ignores the few-hour cache
    @GetMapping("/discover")
    DiscoverService.DiscoverResponse discover(@RequestParam(defaultValue = "false") boolean refresh) {
        return discover.discover(refresh);
    }

    @PostMapping("/import")
    RefreshResult importTitle(@Valid @RequestBody ImportRequest req) { return search.importTitle(req); }

    @GetMapping("/upcoming")
    List<UpcomingEpisode> upcoming(@RequestParam(defaultValue = "6") int limit) {
        return service.upcoming(Math.min(Math.max(limit, 1), 50));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@PathVariable Long id) { service.delete(id); }

    @GetMapping
    List<MediaResponse> list(@RequestParam(required = false) String kind) { return service.list(kind); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    MediaResponse create(@Valid @RequestBody MediaRequest req) { return service.create(req); }

    @GetMapping("/{id}")
    MediaDetail get(@PathVariable Long id) { return service.get(id); }

    @PutMapping("/{id}")
    MediaDetail update(@PathVariable Long id, @Valid @RequestBody MediaRequest req) { return service.update(id, req); }

    @PatchMapping("/{id}/progress")
    MediaDetail progress(@PathVariable Long id, @Valid @RequestBody ProgressRequest req) {
        return service.logProgress(id, req);
    }

    // provider -> id; an empty id unlinks that provider
    @PutMapping("/{id}/links")
    MediaDetail links(@PathVariable Long id, @RequestBody Map<String, String> links) {
        return service.setLinks(id, links);
    }

    @PutMapping("/{id}/milestones")
    MediaDetail milestones(@PathVariable Long id, @Valid @RequestBody List<MilestoneRequest> milestones) {
        return service.setMilestones(id, milestones);
    }

    // Pulls metadata, ratings and artwork from every linked provider
    @PostMapping("/{id}/refresh")
    RefreshResult refresh(@PathVariable Long id) { return refresh.refresh(id); }

    // Covers or backdrops from every linked source, with their sizes
    @GetMapping("/{id}/artwork-options")
    ArtworkOptions artworkOptions(@PathVariable Long id, @RequestParam String slot) {
        checkSlot(slot);
        return refresh.artworkOptions(id, slot);
    }

    // Fetches ratings and episodes, and returns what each field could become without changing it
    @PostMapping("/{id}/suggest")
    SuggestResult suggest(@PathVariable Long id) { return refresh.suggest(id); }

    // Uses a suggested provider image: downloads it onto this server
    @PostMapping("/{id}/artwork/{slot}/from-url")
    MediaDetail artworkFromUrl(@PathVariable Long id, @PathVariable String slot, @RequestBody Map<String, String> body)
            throws IOException, InterruptedException {
        checkSlot(slot);
        String url = body.get("url");
        if (url == null || !ArtworkService.isProviderImage(url)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Not a provider image");
        }
        service.get(id);
        return service.setArtwork(id, slot, artwork.download(id, slot, url));
    }

    private static void checkSlot(String slot) {
        if (!slot.equals("cover") && !slot.equals("backdrop")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Artwork slot must be cover or backdrop");
        }
    }

    // slot is cover or backdrop
    @PostMapping("/{id}/artwork/{slot}")
    MediaDetail uploadArtwork(@PathVariable Long id, @PathVariable String slot,
                              @RequestParam("file") MultipartFile file) throws IOException {
        checkSlot(slot);
        service.get(id);
        String path = artwork.save(id, slot, file.getContentType(), file.getBytes());
        return service.setArtwork(id, slot, path);
    }

    @GetMapping("/{id}/episodes")
    List<EpisodeResponse> episodes(@PathVariable Long id) {
        service.listEpisodes(id);
        return episodes.list(id);
    }

    @PostMapping("/{id}/episodes")
    @ResponseStatus(HttpStatus.CREATED)
    EpisodeResponse addEpisode(@PathVariable Long id, @Valid @RequestBody EpisodeRequest req) {
        return service.addEpisode(id, req);
    }

    // Adds missing episodes and fills or replaces their details from the linked sources
    @PostMapping("/{id}/episodes/fetch")
    RefreshService.EpisodeUpdate updateEpisodes(@PathVariable Long id, @RequestParam(defaultValue = "false") boolean replace) {
        return refresh.updateEpisodes(id, replace);
    }

    @GetMapping("/{id}/episodes/{number}")
    EpisodeResponse episode(@PathVariable Long id, @PathVariable Double number) {
        service.getEpisode(id, number);
        return episodes.get(id, number);
    }

    @PutMapping("/{id}/episodes/{number}")
    EpisodeResponse editEpisode(@PathVariable Long id, @PathVariable Double number, @Valid @RequestBody EpisodeEdit req) {
        service.getEpisode(id, number);
        return episodes.edit(id, number, req);
    }

    // Details and stills for one episode from the linked sources
    @PostMapping("/{id}/episodes/{number}/suggest")
    EpisodeSuggestResult suggestEpisode(@PathVariable Long id, @PathVariable Double number) {
        service.getEpisode(id, number);
        return episodes.suggest(id, number);
    }

    @PostMapping("/{id}/episodes/{number}/images")
    EpisodeResponse addScreenshot(@PathVariable Long id, @PathVariable Double number, @RequestParam("file") MultipartFile file,
                                  @RequestParam(required = false) String caption) throws IOException {
        service.getEpisode(id, number);
        return episodes.addImage(id, number, file.getContentType(), file.getBytes(), caption);
    }

    @PostMapping("/{id}/episodes/{number}/images/from-url")
    EpisodeResponse addScreenshotFromUrl(@PathVariable Long id, @PathVariable Double number,
                                         @RequestBody Map<String, String> body) throws IOException, InterruptedException {
        service.getEpisode(id, number);
        return episodes.addImageFromUrl(id, number, body.get("url"), body.get("caption"));
    }

    @DeleteMapping("/{id}/episodes/{number}/images/{imageId}")
    EpisodeResponse removeScreenshot(@PathVariable Long id, @PathVariable Double number, @PathVariable Long imageId)
            throws IOException {
        return episodes.removeImage(id, number, imageId);
    }

    @PatchMapping("/{id}/episodes/{number}")
    EpisodeResponse updateEpisode(@PathVariable Long id, @PathVariable Double number,
                                  @Valid @RequestBody EpisodeUpdate req) {
        return service.updateEpisode(id, number, req);
    }
}

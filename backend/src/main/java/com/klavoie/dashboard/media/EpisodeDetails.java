package com.klavoie.dashboard.media;

import com.klavoie.dashboard.providers.FetchedEpisode;
import com.klavoie.dashboard.providers.ImageOption;
import com.klavoie.dashboard.providers.ProviderClient;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.function.Function;
import java.util.stream.Collectors;

// One episode at a time: fetching its details, editing it, and its screenshots.
@Service
class EpisodeDetails {

    private final MediaRepository media;
    private final EpisodeRepository episodes;
    private final GalleryImageRepository images;
    private final ArtworkService artwork;
    private final ImageSizes sizes;
    private final Map<String, ProviderClient> clients;

    EpisodeDetails(MediaRepository media, EpisodeRepository episodes, GalleryImageRepository images, ArtworkService artwork,
                   ImageSizes sizes, List<ProviderClient> clients) {
        this.media = media;
        this.episodes = episodes;
        this.images = images;
        this.artwork = artwork;
        this.sizes = sizes;
        this.clients = clients.stream().collect(Collectors.toMap(ProviderClient::provider, Function.identity()));
    }

    @Transactional(readOnly = true)
    public List<EpisodeResponse> list(Long mediaId) {
        Map<Long, List<GalleryImage>> shots = images.findByMediaIdAndEpisodeIdNotNullOrderById(mediaId).stream()
                .collect(Collectors.groupingBy(GalleryImage::getEpisodeId));
        return episodes.findByMediaIdOrderByNumber(mediaId).stream()
                .map(e -> EpisodeResponse.from(e, shots.getOrDefault(e.getId(), List.of()))).toList();
    }

    @Transactional(readOnly = true)
    public EpisodeResponse get(Long mediaId, Double number) {
        return response(find(mediaId, number));
    }

    @Transactional
    public EpisodeResponse edit(Long mediaId, Double number, EpisodeEdit req) {
        Episode e = find(mediaId, number);
        e.setTitle(blankToNull(req.title()));
        e.setHeadline(blankToNull(req.headline()));
        e.setSummary(blankToNull(req.summary()));
        e.setRecap(blankToNull(req.recap()));
        e.setAirDate(blankToNull(req.airDate()));
        e.setMinutes(req.minutes());
        if (req.lockedFields() != null) e.setLockedFields(req.lockedFields());
        return response(episodes.saveAndFlush(e));
    }

    // Asks each linked source about this one episode. The community score updates straight away;
    // field values come back as suggestions, and stills as images to pick from.
    @Transactional
    public EpisodeSuggestResult suggest(Long mediaId, Double number) {
        Media m = media.findById(mediaId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No media " + mediaId));
        Episode e = find(mediaId, number);
        FetchedEpisode known = new FetchedEpisode(e.getNumber().intValue(), e.getSeason(),
                e.getSeasonNumber() == null ? null : e.getSeasonNumber().intValue(), e.getTitle(), e.getAirDate(),
                e.getMinutes(), e.getSummary(), null, null);
        Map<String, String> problems = new TreeMap<>();
        List<Sourced> found = new ArrayList<>();
        List<ImageOption> stills = new ArrayList<>();
        for (var link : m.getLinks().entrySet()) {
            ProviderClient client = clients.get(link.getKey());
            if (client == null || !client.configured()) continue;
            try {
                FetchedEpisode f = client.episode(m.getKind(), link.getValue(), known);
                if (f != null) found.add(new Sourced(link.getKey(), f));
                stills.addAll(client.episodeImages(m.getKind(), link.getValue(), known));
            } catch (Exception ex) {
                problems.put(link.getKey(), ex.getMessage() == null ? "Couldn't reach the provider" : ex.getMessage());
            }
        }
        for (Sourced s : found) {
            if (s.episode().communityScore() != null) {
                e.setCommunityScore(s.episode().communityScore());
                e.setCommunityVotes(s.episode().communityVotes());
                break;
            }
        }
        List<Suggestion> suggestions = new ArrayList<>();
        suggest(e, found, suggestions, "title", e.getTitle(), FetchedEpisode::title);
        suggest(e, found, suggestions, "airDate", e.getAirDate(), FetchedEpisode::airDate);
        suggest(e, found, suggestions, "minutes", e.getMinutes(), FetchedEpisode::minutes);
        suggest(e, found, suggestions, "summary", e.getSummary(), FetchedEpisode::summary);
        if (found.isEmpty() && problems.isEmpty()) problems.put("sources", "None of this title's linked sources have single-episode details");
        List<ImageOption> measured = sizes.measure(stills).stream()
                .sorted(Comparator.comparingLong((ImageOption o) -> o.width() == null ? 0 : (long) o.width() * o.height()).reversed())
                .toList();
        return new EpisodeSuggestResult(response(episodes.saveAndFlush(e)), suggestions, measured, problems);
    }

    record Sourced(String provider, FetchedEpisode episode) {}

    private static <T> void suggest(Episode e, List<Sourced> found, List<Suggestion> out, String field, Object current,
                                    Function<FetchedEpisode, T> read) {
        if (e.isLocked(field)) return;
        for (Sourced s : found) {
            T value = read.apply(s.episode());
            if (value == null || (value instanceof String str && str.isBlank())) continue;
            boolean same = current != null && (current instanceof Number a && value instanceof Number b
                    ? a.doubleValue() == b.doubleValue() : current.toString().trim().equals(value.toString().trim()));
            if (!same) out.add(new Suggestion(field, current, value, s.provider()));
            return;
        }
    }

    @Transactional
    public EpisodeResponse addImage(Long mediaId, Double number, String contentType, byte[] bytes, String caption) throws IOException {
        Episode e = find(mediaId, number);
        GalleryImage image = new GalleryImage();
        image.setMediaId(mediaId);
        image.setEpisodeId(e.getId());
        image.setCaption(blankToNull(caption));
        image.setPath(artwork.store("episodes", mediaId + "-" + e.getNumber().intValue() + "-" + System.currentTimeMillis(), contentType, bytes));
        images.saveAndFlush(image);
        return response(e);
    }

    public EpisodeResponse addImageFromUrl(Long mediaId, Double number, String url, String caption) throws IOException, InterruptedException {
        ArtworkService.Downloaded d = artwork.fetch(url);
        return addImage(mediaId, number, d.contentType(), d.bytes(), caption);
    }

    @Transactional
    public EpisodeResponse removeImage(Long mediaId, Double number, Long imageId) throws IOException {
        Episode e = find(mediaId, number);
        GalleryImage image = images.findById(imageId)
                .filter(i -> e.getId().equals(i.getEpisodeId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No screenshot " + imageId));
        images.delete(image);
        artwork.remove(image.getPath());
        return response(e);
    }

    private EpisodeResponse response(Episode e) {
        return EpisodeResponse.from(e, images.findByEpisodeIdOrderById(e.getId()));
    }

    private Episode find(Long mediaId, Double number) {
        return episodes.findByMediaIdAndNumber(mediaId, number)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No episode " + number));
    }

    private static String blankToNull(String s) { return s == null || s.isBlank() ? null : s.trim(); }
}

package com.klavoie.dashboard.media;

import com.klavoie.dashboard.providers.Fetched;
import com.klavoie.dashboard.providers.FetchedEpisode;
import com.klavoie.dashboard.providers.ProviderClient;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.function.Supplier;
import java.util.stream.Collectors;

// Pulls metadata, ratings and artwork from every linked provider.
// Ratings are always replaced; other fields are only filled in when empty, so your edits stay.
@Service
class RefreshService {

    private final MediaRepository repo;
    private final EpisodeRepository episodes;
    private final MediaService media;
    private final ArtworkService artwork;
    private final ImageSizes sizes;
    private final Map<String, ProviderClient> clients;
    private final List<com.klavoie.dashboard.providers.ArtworkSource> artworkSources;

    RefreshService(MediaRepository repo, EpisodeRepository episodes, MediaService media, ArtworkService artwork,
                   ImageSizes sizes, List<ProviderClient> clients,
                   List<com.klavoie.dashboard.providers.ArtworkSource> artworkSources) {
        this.artworkSources = artworkSources;
        this.sizes = sizes;
        this.repo = repo;
        this.episodes = episodes;
        this.media = media;
        this.artwork = artwork;
        this.clients = clients.stream().collect(Collectors.toMap(ProviderClient::provider, Function.identity()));
    }

    // Used when importing: fills every empty, unlocked field straight away
    @Transactional
    public RefreshResult refresh(Long id) {
        Media m = find(id);
        Map<String, String> problems = new TreeMap<>();
        List<Sourced> found = fetchAll(m, problems);
        for (Sourced s : found) fillBlanks(m, s.fetched());
        fetchArtwork(m, found, problems);
        return new RefreshResult(media.detailOf(repo.saveAndFlush(m)), problems);
    }

    // Used from the edit dialog: updates ratings and episodes, and lists what each field could become.
    // Nothing in your fields changes until you accept a suggestion and save.
    @Transactional
    public SuggestResult suggest(Long id) {
        Media m = find(id);
        Map<String, String> problems = new TreeMap<>();
        List<Sourced> found = fetchAll(m, problems);
        List<Suggestion> suggestions = new ArrayList<>();
        suggestField(m, found, suggestions, "title", m.getTitle(), Fetched::title);
        suggestField(m, found, suggestions, "originalTitle", m.getOriginalTitle(), Fetched::originalTitle);
        suggestField(m, found, suggestions, "creator", m.getCreator(), Fetched::creator);
        suggestField(m, found, suggestions, "releaseYear", m.getReleaseYear(), Fetched::releaseYear);
        suggestField(m, found, suggestions, "endYear", m.getEndYear(), Fetched::endYear);
        suggestField(m, found, suggestions, "format", m.getFormat(), Fetched::format);
        suggestField(m, found, suggestions, "synopsis", m.getSynopsis(), Fetched::synopsis);
        suggestField(m, found, suggestions, "total", m.getTotal(), Fetched::total);
        suggestField(m, found, suggestions, "unitMinutes", m.getUnitMinutes(), Fetched::unitMinutes);
        suggestField(m, found, suggestions, "tags", List.copyOf(m.getTags()), f -> f.tags() == null || f.tags().isEmpty() ? null : f.tags());
        suggestField(m, found, suggestions, "cover", m.getCover(), Fetched::coverUrl);
        suggestField(m, found, suggestions, "backdrop", m.getBackdrop(), Fetched::backdropUrl);
        return new SuggestResult(media.detailOf(repo.saveAndFlush(m)), suggestions, problems);
    }

    record Sourced(String provider, Fetched fetched) {}

    // Every cover or wide artwork the linked sources have, measured and largest first
    @Transactional(readOnly = true)
    public ArtworkOptions artworkOptions(Long id, String slot) {
        Media m = find(id);
        Map<String, String> problems = new TreeMap<>();
        List<com.klavoie.dashboard.providers.ImageOption> options = new ArrayList<>();
        for (var link : m.getLinks().entrySet()) {
            ProviderClient client = clients.get(link.getKey());
            if (client == null || !client.configured()) continue;
            try {
                options.addAll(client.images(m.getKind(), link.getValue(), slot));
            } catch (Exception e) {
                problems.put(link.getKey(), e.getMessage() == null ? "Couldn't reach the provider" : e.getMessage());
            }
        }
        // Artwork-only sources, found through the title's other links
        for (com.klavoie.dashboard.providers.ArtworkSource source : artworkSources) {
            if (!source.configured()) continue;
            try {
                options.addAll(source.images(m.getKind(), m.getLinks(), slot));
            } catch (Exception e) {
                problems.put(source.provider(), e.getMessage() == null ? "Couldn't reach the provider" : e.getMessage());
            }
        }
        List<com.klavoie.dashboard.providers.ImageOption> measured = sizes.measure(options).stream()
                .sorted(java.util.Comparator.comparingLong((com.klavoie.dashboard.providers.ImageOption o) ->
                        o.width() == null ? 0 : (long) o.width() * o.height()).reversed())
                .toList();
        return new ArtworkOptions(measured, problems);
    }

    // Reads every linked provider; ratings are replaced and episodes imported along the way
    private List<Sourced> fetchAll(Media m, Map<String, String> problems) {
        List<Sourced> found = new ArrayList<>();
        for (var link : m.getLinks().entrySet()) {
            ProviderClient client = clients.get(link.getKey());
            if (client == null) {
                problems.put(link.getKey(), "Fetching from this provider isn't supported yet");
                continue;
            }
            if (!client.configured()) {
                problems.put(link.getKey(), "Needs an API key in Settings");
                continue;
            }
            try {
                Fetched f = client.fetch(m.getKind(), link.getValue());
                found.add(new Sourced(link.getKey(), f));
                m.getProviderRatings().removeIf(r -> r.getProvider().equals(link.getKey()));
                if (f.score() != null) {
                    m.getProviderRatings().add(new ProviderRating(link.getKey(), f.score(), f.scale(),
                            f.votes() == null ? 0 : f.votes(), Instant.now().toString()));
                }
            } catch (NumberFormatException e) {
                problems.put(link.getKey(), "The linked id should be a number");
            } catch (Exception e) {
                problems.put(link.getKey(), e.getMessage() == null ? "Couldn't reach the provider" : e.getMessage());
            }
        }
        if (MediaService.EPISODIC_KINDS.contains(m.getKind())) importEpisodes(m, problems);
        return found;
    }

    // The first provider with a different value wins; locked fields get no suggestions
    private static <T> void suggestField(Media m, List<Sourced> found, List<Suggestion> out, String field,
                                         Object current, Function<Fetched, T> read) {
        if (m.isLocked(field)) return;
        for (Sourced s : found) {
            T value = read.apply(s.fetched());
            if (value == null || (value instanceof String str && str.isBlank())) continue;
            if (!sameValue(current, value)) out.add(new Suggestion(field, current, value, s.provider()));
            return;
        }
    }

    // Numbers compare by value (28 == 28.0), lists ignoring order
    private static boolean sameValue(Object current, Object value) {
        if (current == null) return false;
        if (current instanceof Number a && value instanceof Number b) return a.doubleValue() == b.doubleValue();
        if (current instanceof List<?> a && value instanceof List<?> b) return new java.util.HashSet<>(a).equals(new java.util.HashSet<>(b));
        return current.toString().trim().equals(value.toString().trim());
    }

    private Media find(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No media " + id));
    }

    record EpisodeUpdate(int added, int updated, int total, String source, Map<String, String> problems) {}

    // "Update episodes": adds missing episodes and fills their details from the first linked source with a list.
    // With replace, details you haven't locked are replaced too; without it only empty ones are filled.
    @Transactional
    public EpisodeUpdate updateEpisodes(Long id, boolean replace) {
        Media m = find(id);
        if (!MediaService.EPISODIC_KINDS.contains(m.getKind())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, m.getKind() + " has no episodes");
        }
        Map<String, String> problems = new TreeMap<>();
        Imported counts = importEpisodes(m, problems, replace);
        if (counts == null) {
            if (problems.isEmpty()) problems.put("sources", "None of the linked sources have an episode list for this title");
            return new EpisodeUpdate(0, 0, 0, null, problems);
        }
        return new EpisodeUpdate(counts.added(), counts.updated(), counts.total(), counts.source(), problems);
    }

    record Imported(int added, int updated, int total, String source) {}

    private void importEpisodes(Media m, Map<String, String> problems) { importEpisodes(m, problems, false); }

    // Takes the first linked provider with an episode list; null when none had one.
    // Locked episode fields are never touched; watched dates, your ratings and notes are never part of this.
    private Imported importEpisodes(Media m, Map<String, String> problems, boolean replace) {
        for (var link : m.getLinks().entrySet()) {
            ProviderClient client = clients.get(link.getKey());
            if (client == null || !client.configured()) continue;
            List<FetchedEpisode> list;
            try {
                list = client.episodes(m.getKind(), link.getValue());
            } catch (Exception e) {
                problems.putIfAbsent(link.getKey(), "Couldn't load episodes: " + e.getMessage());
                continue;
            }
            if (list.isEmpty()) continue;
            int added = 0, updated = 0;
            for (FetchedEpisode f : list) {
                var existing = episodes.findByMediaIdAndNumber(m.getId(), (double) f.number());
                Episode e = existing.orElseGet(() -> {
                    Episode created = new Episode();
                    created.setMediaId(m.getId());
                    created.setNumber((double) f.number());
                    created.setViews(0);
                    return created;
                });
                boolean changed = false;
                changed |= put(e, replace, "season", e::getSeason, e::setSeason, f.season());
                changed |= put(e, replace, "seasonNumber", e::getSeasonNumber, e::setSeasonNumber,
                        f.seasonNumber() == null ? null : f.seasonNumber().doubleValue());
                changed |= put(e, replace, "title", e::getTitle, e::setTitle, f.title());
                changed |= put(e, replace, "airDate", e::getAirDate, e::setAirDate, f.airDate());
                changed |= put(e, replace, "minutes", e::getMinutes, e::setMinutes, f.minutes());
                changed |= put(e, replace, "summary", e::getSummary, e::setSummary, f.summary());
                // Community scores change, so they're always refreshed
                if (f.communityScore() != null) {
                    e.setCommunityScore(f.communityScore());
                    e.setCommunityVotes(f.communityVotes());
                }
                episodes.save(e);
                if (existing.isEmpty()) added++;
                else if (changed) updated++;
            }
            return new Imported(added, updated, list.size(), link.getKey());
        }
        return null;
    }

    // Sets an episode field from a source: always when empty, and when replacing unless locked
    private static <T> boolean put(Episode e, boolean replace, String field, Supplier<T> current, Consumer<T> set, T value) {
        if (value == null || (value instanceof String s && s.isBlank()) || e.isLocked(field)) return false;
        T now = current.get();
        boolean empty = now == null || (now instanceof String s && s.isBlank());
        if (!empty && (!replace || now.equals(value))) return false;
        set.accept(value);
        return true;
    }

    private void fillBlanks(Media m, Fetched f) {
        if (!m.isLocked("title")) fill(m::getTitle, m::setTitle, f.title());
        if (!m.isLocked("originalTitle")) fill(m::getOriginalTitle, m::setOriginalTitle, f.originalTitle());
        if (!m.isLocked("creator")) fill(m::getCreator, m::setCreator, f.creator());
        if (!m.isLocked("releaseYear")) fill(m::getReleaseYear, m::setReleaseYear, f.releaseYear());
        if (!m.isLocked("endYear")) fill(m::getEndYear, m::setEndYear, f.endYear());
        if (!m.isLocked("format")) fill(m::getFormat, m::setFormat, f.format());
        if (!m.isLocked("synopsis")) fill(m::getSynopsis, m::setSynopsis, f.synopsis());
        if (!m.isLocked("total")) fill(m::getTotal, m::setTotal, f.total());
        if (!m.isLocked("unitMinutes")) fill(m::getUnitMinutes, m::setUnitMinutes, f.unitMinutes());
        if (!m.isLocked("tags") && m.getTags().isEmpty() && f.tags() != null) m.getTags().addAll(f.tags());
    }

    private static <T> void fill(Supplier<T> current, Consumer<T> set, T value) {
        T now = current.get();
        boolean empty = now == null || (now instanceof String s && s.isBlank());
        if (empty && value != null) set.accept(value);
    }

    // Only downloads when there's no artwork yet, so an uploaded cover isn't replaced
    private void fetchArtwork(Media m, List<Sourced> found, Map<String, String> problems) {
        try {
            if (isBlank(m.getCover()) && !m.isLocked("cover")) {
                String url = found.stream().map(s -> s.fetched().coverUrl()).filter(u -> u != null).findFirst().orElse(null);
                if (url != null) m.setCover(artwork.download(m.getId(), "cover", url));
            }
            if (isBlank(m.getBackdrop()) && !m.isLocked("backdrop")) {
                String url = found.stream().map(s -> s.fetched().backdropUrl()).filter(u -> u != null).findFirst().orElse(null);
                if (url != null) m.setBackdrop(artwork.download(m.getId(), "backdrop", url));
            }
        } catch (Exception e) {
            problems.put("artwork", e.getMessage() == null ? "Couldn't download artwork" : e.getMessage());
        }
    }

    private static boolean isBlank(String s) { return s == null || s.isBlank(); }
}

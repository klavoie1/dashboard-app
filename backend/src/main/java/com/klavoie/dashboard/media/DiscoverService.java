package com.klavoie.dashboard.media;

import com.klavoie.dashboard.providers.ProviderClient;
import com.klavoie.dashboard.providers.SearchHit;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

// Discover: suggestions built from your library ("Because you liked …") and what's trending on your sources.
// Results are kept for a few hours, since recommendations change slowly and sources have rate limits.
@Service
class DiscoverService {

    private static final long CACHE_MS = 6 * 60 * 60 * 1000;
    private static final int SEEDS = 4;
    private static final int PER_SHELF = 10;
    private static final long TIMEOUT_SECONDS = 15;

    record Shelf(String id, String title, String subtitle, Long seedId, List<SearchResponse.Result> items) {}

    record DiscoverResponse(List<Shelf> shelves, Map<String, String> problems, String builtAt) {}

    private final MediaRepository repo;
    private final List<ProviderClient> clients;
    private DiscoverResponse cached;
    private String cachedFor;
    private long cachedAt;

    DiscoverService(MediaRepository repo, List<ProviderClient> clients) {
        this.repo = repo;
        this.clients = clients;
    }

    // What Discover needs from a title, copied so background lookups never touch the database session
    record Seed(Long id, String title, String kind, Double rating, String status, String lastActivity, Map<String, String> links) {}

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public synchronized DiscoverResponse discover(boolean refresh) {
        List<Seed> library = repo.findAll().stream().map(m -> new Seed(m.getId(), m.getTitle(), m.getKind(), m.getRating(),
                m.getStatus(), m.getLastActivityOn(), Map.copyOf(m.getLinks()))).toList();
        // The cache is reused only while the library looks the same
        String fingerprint = library.stream().map(m -> m.id() + ":" + m.rating() + ":" + m.status()).sorted().collect(Collectors.joining(","));
        if (!refresh && cached != null && fingerprint.equals(cachedFor) && System.currentTimeMillis() - cachedAt < CACHE_MS) return cached;

        Map<String, ProviderClient> byName = clients.stream().collect(Collectors.toMap(ProviderClient::provider, c -> c));
        Map<String, String> problems = new TreeMap<>();
        Set<String> owned = new HashSet<>();
        library.forEach(m -> m.links().forEach((p, id) -> owned.add(p + ":" + id)));

        // Seeds: the titles you rated highest, then the ones you touched most recently, one per kind first
        List<Seed> ranked = library.stream().filter(m -> !m.links().isEmpty() && !"dropped".equals(m.status()))
                .sorted(Comparator.comparing((Seed m) -> m.rating() == null ? 0 : m.rating()).reversed()
                        .thenComparing(m -> m.lastActivity() == null ? "" : m.lastActivity(), Comparator.reverseOrder()))
                .toList();
        List<Seed> seeds = new ArrayList<>();
        Set<String> kinds = new HashSet<>();
        for (Seed m : ranked) if (seeds.size() < SEEDS && kinds.add(m.kind())) seeds.add(m);
        for (Seed m : ranked) if (seeds.size() < SEEDS && !seeds.contains(m)) seeds.add(m);

        Map<Seed, CompletableFuture<List<SearchHit>>> similar = new LinkedHashMap<>();
        for (Seed seed : seeds) {
            similar.put(seed, CompletableFuture.supplyAsync(() -> {
                for (var link : seed.links().entrySet()) {
                    ProviderClient client = byName.get(link.getKey());
                    if (client == null || !client.configured()) continue;
                    try {
                        List<SearchHit> hits = client.similar(seed.kind(), link.getValue());
                        if (!hits.isEmpty()) return hits;
                    } catch (Exception e) {
                        // Another linked source may still have suggestions
                    }
                }
                return List.of();
            }));
        }
        Map<String, CompletableFuture<List<ProviderClient.Shelf>>> trending = new LinkedHashMap<>();
        for (ProviderClient client : clients) {
            if (!client.configured()) continue;
            trending.put(client.provider(), CompletableFuture.supplyAsync(() -> {
                try {
                    return client.trending();
                } catch (Exception e) {
                    throw new IllegalStateException(e.getMessage() == null ? "Couldn't reach the provider" : e.getMessage(), e);
                }
            }));
        }

        Set<String> shown = new HashSet<>();
        List<Shelf> shelves = new ArrayList<>();
        for (var entry : similar.entrySet()) {
            List<SearchResponse.Result> items = pick(wait(entry.getValue(), null, problems), owned, shown);
            if (!items.isEmpty()) {
                Seed seed = entry.getKey();
                shelves.add(new Shelf("similar-" + seed.id(), "Because you liked " + seed.title(),
                        "Picked by people who loved it too", seed.id(), items));
            }
        }
        for (var entry : trending.entrySet()) {
            for (ProviderClient.Shelf shelf : wait(entry.getValue(), entry.getKey(), problems)) {
                List<SearchResponse.Result> items = pick(shelf.items(), owned, shown);
                if (!items.isEmpty()) shelves.add(new Shelf(shelf.id(), shelf.title(), shelf.subtitle(), null, items));
            }
        }
        cached = new DiscoverResponse(shelves, problems, java.time.Instant.now().toString());
        cachedFor = fingerprint;
        cachedAt = System.currentTimeMillis();
        return cached;
    }

    // Leaves out what's already in your library and what another shelf already shows
    private static List<SearchResponse.Result> pick(List<SearchHit> hits, Set<String> owned, Set<String> shown) {
        List<SearchResponse.Result> out = new ArrayList<>();
        for (SearchHit h : hits) {
            String key = h.provider() + ":" + h.externalId();
            if (owned.contains(key) || !shown.add(key) || h.title() == null) continue;
            out.add(new SearchResponse.Result(h, null));
            if (out.size() == PER_SHELF) break;
        }
        return out;
    }

    private static <T> List<T> wait(CompletableFuture<List<T>> future, String provider, Map<String, String> problems) {
        try {
            return future.get(TIMEOUT_SECONDS, TimeUnit.SECONDS);
        } catch (Exception e) {
            if (provider != null) {
                Throwable cause = e.getCause() != null ? e.getCause() : e;
                problems.put(provider, cause.getMessage() == null ? "Didn't answer in time" : cause.getMessage());
            }
            return List.of();
        }
    }
}

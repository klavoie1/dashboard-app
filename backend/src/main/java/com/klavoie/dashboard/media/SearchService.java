package com.klavoie.dashboard.media;

import com.klavoie.dashboard.providers.ProviderClient;
import com.klavoie.dashboard.providers.SearchHit;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

// Searches every configured provider at once and adds library matches.
@Service
class SearchService {

    private static final long TIMEOUT_SECONDS = 12;

    private final List<ProviderClient> clients;
    private final MediaRepository repo;
    private final MediaService media;
    private final RefreshService refresh;

    SearchService(List<ProviderClient> clients, MediaRepository repo, MediaService media, RefreshService refresh) {
        this.clients = clients;
        this.repo = repo;
        this.media = media;
        this.refresh = refresh;
    }

    SearchResponse search(String query) {
        Map<String, String> problems = new TreeMap<>();
        Map<String, CompletableFuture<List<SearchHit>>> pending = new TreeMap<>();
        for (ProviderClient client : clients) {
            if (!client.configured()) {
                problems.put(client.provider(), "Needs an API key in Settings");
                continue;
            }
            pending.put(client.provider(), CompletableFuture.supplyAsync(() -> {
                try {
                    return client.search(query);
                } catch (Exception e) {
                    throw new IllegalStateException(e.getMessage() == null ? "Search failed" : e.getMessage(), e);
                }
            }));
        }

        List<SearchResponse.Result> results = new ArrayList<>();
        for (var entry : pending.entrySet()) {
            try {
                for (SearchHit hit : entry.getValue().get(TIMEOUT_SECONDS, TimeUnit.SECONDS)) {
                    Long id = repo.findIdsByLink(hit.provider(), hit.externalId()).stream().findFirst().orElse(null);
                    results.add(new SearchResponse.Result(hit, id));
                }
            } catch (Exception e) {
                Throwable cause = e.getCause() != null ? e.getCause() : e;
                problems.put(entry.getKey(), cause.getMessage() == null ? "Didn't answer in time" : cause.getMessage());
            }
        }
        return new SearchResponse(results, problems);
    }

    // Creates the title from a search result, links it and fetches everything.
    // A title already linked to that provider id is returned instead of a duplicate.
    RefreshResult importTitle(ImportRequest req) {
        Long existing = repo.findIdsByLink(req.provider(), req.externalId()).stream().findFirst().orElse(null);
        if (existing != null) return new RefreshResult(media.get(existing), Map.of());
        MediaResponse created = media.create(new MediaRequest(req.kind(), req.title(), null, null, null, null, null,
                null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null));
        media.setLinks(created.id(), Map.of(req.provider(), req.externalId()));
        return refresh.refresh(created.id());
    }
}

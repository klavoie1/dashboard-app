package com.klavoie.dashboard.providers;

import java.util.List;

public interface ProviderClient {

    // Matches the provider names in media_links
    String provider();

    // False when an API key it needs hasn't been set
    boolean configured();

    // kind is the media kind (anime, manga, tv...), externalId the id saved for this provider
    Fetched fetch(String kind, String externalId) throws Exception;

    // Titles matching a search; kinds it can't tell apart are guessed from the provider's format
    default List<SearchHit> search(String query) throws Exception { return List.of(); }

    // Episode list for anime and tv; empty when the provider doesn't have one
    default List<FetchedEpisode> episodes(String kind, String externalId) throws Exception { return List.of(); }

    // One episode in full, e.g. with a summary the list leaves out; null when there's nothing more
    default FetchedEpisode episode(String kind, String externalId, FetchedEpisode known) throws Exception { return null; }

    // Stills for one episode, for screenshots
    default List<ImageOption> episodeImages(String kind, String externalId, FetchedEpisode known) throws Exception { return List.of(); }

    // The cast of a title, in billing order
    default List<FetchedCharacter> characters(String kind, String externalId) throws Exception { return List.of(); }

    // One character in full, by this provider's character id; null when unsupported
    default FetchedCharacter character(String characterId) throws Exception { return null; }

    // Every cover ("cover") or wide artwork ("backdrop") this provider has for a title
    default List<ImageOption> images(String kind, String externalId, String slot) throws Exception { return List.of(); }

    // Titles people who liked this one also liked, for Discover
    default List<SearchHit> similar(String kind, String externalId) throws Exception { return List.of(); }

    // What's popular right now, as named shelves, for Discover
    default List<Shelf> trending() throws Exception { return List.of(); }

    record Shelf(String id, String title, String subtitle, List<SearchHit> items) {}
}

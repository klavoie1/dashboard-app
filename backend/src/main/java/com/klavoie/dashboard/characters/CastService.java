package com.klavoie.dashboard.characters;

import com.klavoie.dashboard.media.ArtworkService;
import com.klavoie.dashboard.media.ImageSizes;
import com.klavoie.dashboard.media.MediaDetail;
import com.klavoie.dashboard.media.MediaService;
import com.klavoie.dashboard.media.Suggestion;
import com.klavoie.dashboard.providers.FetchedCharacter;
import com.klavoie.dashboard.providers.ImageOption;
import com.klavoie.dashboard.providers.ProviderClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.function.Function;
import java.util.stream.Collectors;

// Fetching characters: a title's whole cast, or one character's full details.
@Service
class CastService {

    // When several sources are linked, the cast comes from the first of these that has one
    private static final List<String> CAST_ORDER = List.of("anilist", "myanimelist", "tmdb", "tvmaze", "igdb");
    // Sources list main characters first, so the cap keeps the people who matter and drops background extras
    static final int MAX_CAST = 50;

    private final CharacterRepository repo;
    private final AppearanceRepository appearances;
    private final CharacterService characters;
    private final MediaService media;
    private final ArtworkService artwork;
    private final ImageSizes sizes;
    private final ObjectMapper json;
    private final Map<String, ProviderClient> clients;

    CastService(CharacterRepository repo, AppearanceRepository appearances, CharacterService characters, MediaService media,
                ArtworkService artwork, ImageSizes sizes, ObjectMapper json, List<ProviderClient> clients) {
        this.repo = repo;
        this.appearances = appearances;
        this.characters = characters;
        this.media = media;
        this.artwork = artwork;
        this.sizes = sizes;
        this.json = json;
        this.clients = clients.stream().collect(Collectors.toMap(ProviderClient::provider, Function.identity()));
    }

    record CastResult(List<CharacterResponse> cast, String source, Map<String, String> problems) {}

    // Adds or updates every character in the title's cast. A character already linked to the same
    // provider id is reused, so a character shared by the anime and the manga stays one person.
    // Only empty, unlocked fields are filled; parts (role, voice actor, order) always update.
    @Transactional
    public CastResult fetchCast(Long mediaId) {
        MediaDetail m = media.get(mediaId);
        Map<String, String> problems = new TreeMap<>();
        for (String provider : CAST_ORDER) {
            String externalId = m.links().get(provider);
            ProviderClient client = clients.get(provider);
            if (externalId == null || client == null) continue;
            if (!client.configured()) {
                problems.put(provider, "Needs an API key in Settings");
                continue;
            }
            List<FetchedCharacter> cast;
            try {
                cast = client.characters(m.kind(), externalId);
            } catch (Exception e) {
                problems.put(provider, e.getMessage() == null ? "Couldn't reach the provider" : e.getMessage());
                continue;
            }
            if (cast.isEmpty()) continue;
            if (cast.size() > MAX_CAST) cast = cast.subList(0, MAX_CAST);
            java.util.Set<Long> kept = new java.util.HashSet<>();
            int position = 0;
            for (FetchedCharacter f : cast) {
                StoryCharacter c = repo.findIdsByLink(provider, f.externalId()).stream().findFirst()
                        .flatMap(repo::findById).orElseGet(StoryCharacter::new);
                if (c.getId() == null) c.setName(f.name());
                fillBlank(c, "nativeName", c.getNativeName(), f.nativeName(), c::setNativeName);
                fillBlank(c, "about", c.getAbout(), f.description(), c::setAbout);
                c.getLinks().put(provider, f.externalId());
                StoryCharacter saved = repo.saveAndFlush(c);
                if (isBlank(saved.getPortrait()) && !saved.isLocked("portrait") && f.imageUrl() != null) {
                    try {
                        ArtworkService.Downloaded d = artwork.fetch(f.imageUrl());
                        saved.setPortrait(artwork.store("characters", String.valueOf(saved.getId()), d.contentType(), d.bytes()));
                    } catch (Exception e) {
                        problems.putIfAbsent("portraits", "Some portraits couldn't be downloaded");
                    }
                }
                CharacterAppearance a = appearances.findById(new CharacterAppearance.Key(saved.getId(), mediaId))
                        .orElseGet(() -> new CharacterAppearance(saved.getId(), mediaId));
                a.setRole(f.role());
                a.setActor(f.actor());
                a.setActorLanguage(f.actorLanguage());
                a.setPosition(position++);
                appearances.save(a);
                kept.add(saved.getId());
            }
            // Characters an earlier fetch from this source added that are no longer in the cast (e.g. past the cap)
            // leave this title; characters you added yourself, or from other sources, stay
            for (CharacterAppearance a : appearances.findByMediaId(mediaId)) {
                if (kept.contains(a.getCharacterId())) continue;
                repo.findById(a.getCharacterId()).filter(c -> c.getLinks().containsKey(provider)).ifPresent(c -> appearances.delete(a));
            }
            appearances.flush();
            return new CastResult(characters.list(null, mediaId), provider, problems);
        }
        if (problems.isEmpty()) problems.put("sources", "Link AniList, MyAnimeList, TMDb, TVmaze or IGDB to fetch characters");
        return new CastResult(characters.list(null, mediaId), null, problems);
    }

    record CharacterSuggestions(CharacterResponse character, List<Suggestion> suggestions, List<ImageOption> portraits,
                                Map<String, String> problems) {}

    // Asks each linked source about this character; fields come back as suggestions, images as portraits to pick
    @Transactional(readOnly = true)
    public CharacterSuggestions suggest(Long id) {
        StoryCharacter c = characters.find(id);
        Map<String, String> problems = new TreeMap<>();
        List<Sourced> found = new ArrayList<>();
        List<ImageOption> portraits = new ArrayList<>();
        for (var link : c.getLinks().entrySet()) {
            ProviderClient client = clients.get(link.getKey());
            if (client == null || !client.configured()) continue;
            try {
                FetchedCharacter f = client.character(link.getValue());
                if (f == null) continue;
                found.add(new Sourced(link.getKey(), f));
                if (f.imageUrl() != null) portraits.add(new ImageOption(link.getKey(), f.imageUrl(), null, null, "Portrait"));
            } catch (Exception e) {
                problems.put(link.getKey(), e.getMessage() == null ? "Couldn't reach the provider" : e.getMessage());
            }
        }
        if (c.getLinks().isEmpty()) problems.put("sources", "Link this character to a source first, or fetch the cast from a title");
        List<Suggestion> suggestions = new ArrayList<>();
        suggest(c, found, suggestions, "name", c.getName(), FetchedCharacter::name);
        suggest(c, found, suggestions, "nativeName", c.getNativeName(), FetchedCharacter::nativeName);
        suggest(c, found, suggestions, "about", c.getAbout(), FetchedCharacter::description);
        suggest(c, found, suggestions, "details", c.getDetails(), f -> detailsJson(f.details()));
        return new CharacterSuggestions(characters.get(id), suggestions, sizes.largestFirst(portraits), problems);
    }

    record Sourced(String provider, FetchedCharacter character) {}

    private static <T> void suggest(StoryCharacter c, List<Sourced> found, List<Suggestion> out, String field, Object current,
                                    Function<FetchedCharacter, T> read) {
        if (c.isLocked(field)) return;
        for (Sourced s : found) {
            T value = read.apply(s.character());
            if (value == null || (value instanceof String str && str.isBlank())) continue;
            if (current == null || !current.toString().trim().equals(value.toString().trim())) {
                out.add(new Suggestion(field, current, value, s.provider()));
            }
            return;
        }
    }

    // Details are stored like a title's: a JSON list of {label, value}
    private String detailsJson(Map<String, String> details) {
        if (details == null || details.isEmpty()) return null;
        List<Map<String, String>> list = new ArrayList<>();
        details.forEach((label, value) -> {
            Map<String, String> row = new LinkedHashMap<>();
            row.put("label", label);
            row.put("value", value);
            list.add(row);
        });
        return json.writeValueAsString(list);
    }

    private static void fillBlank(StoryCharacter c, String field, String current, String value, java.util.function.Consumer<String> set) {
        if (!c.isLocked(field) && isBlank(current) && !isBlank(value)) set.accept(value);
    }

    private static boolean isBlank(String s) { return s == null || s.isBlank(); }
}

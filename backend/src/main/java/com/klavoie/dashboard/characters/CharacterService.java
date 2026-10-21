package com.klavoie.dashboard.characters;

import com.klavoie.dashboard.media.ArtworkService;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CharacterService {

    // Fields a fetch can suggest, and so can be locked
    static final String LOCKABLE_PATTERN = "name|nativeName|about|details|portrait";
    static final java.util.Set<String> PROVIDERS = java.util.Set.of("anilist", "myanimelist", "tmdb", "tvmaze", "igdb");

    private final CharacterRepository repo;
    private final AppearanceRepository appearances;
    private final ArtworkService artwork;
    private final com.klavoie.dashboard.media.ImageService images;

    CharacterService(CharacterRepository repo, AppearanceRepository appearances, ArtworkService artwork,
                     com.klavoie.dashboard.media.ImageService images) {
        this.images = images;
        this.repo = repo;
        this.appearances = appearances;
        this.artwork = artwork;
    }

    @Transactional(readOnly = true)
    public List<CharacterResponse> list(Long franchiseId, Long mediaId) {
        List<StoryCharacter> found;
        if (franchiseId != null) found = repo.findByFranchise(franchiseId);
        else if (mediaId != null) found = repo.findByMedia(mediaId);
        else found = repo.findAll(Sort.by("name"));
        return withAppearances(found);
    }

    @Transactional(readOnly = true)
    public CharacterResponse get(Long id) {
        return withAppearances(List.of(find(id))).getFirst();
    }

    @Transactional
    public CharacterResponse create(CharacterRequest req) {
        StoryCharacter c = new StoryCharacter();
        apply(c, req);
        c.setPortrait(req.portrait());
        if (req.franchiseIds() != null) c.getFranchiseIds().addAll(req.franchiseIds());
        StoryCharacter saved = repo.saveAndFlush(c);
        if (req.mediaIds() != null) {
            req.mediaIds().forEach(m -> appearances.save(new CharacterAppearance(saved.getId(), m)));
            appearances.flush();
        }
        return get(saved.getId());
    }

    @Transactional
    public CharacterResponse update(Long id, CharacterRequest req) {
        StoryCharacter c = find(id);
        apply(c, req);
        if (req.franchiseIds() != null) {
            c.getFranchiseIds().clear();
            c.getFranchiseIds().addAll(req.franchiseIds());
        }
        repo.saveAndFlush(c);
        return get(id);
    }

    private void apply(StoryCharacter c, CharacterRequest req) {
        c.setName(req.name().trim());
        c.setNativeName(blankToNull(req.nativeName()));
        c.setRole(blankToNull(req.role()));
        c.setAbout(blankToNull(req.about()));
        c.setDetails(blankToNull(req.details()));
        if (req.favorite() != null) c.setFavorite(req.favorite());
        if (req.lockedFields() != null) c.setLockedFields(req.lockedFields());
    }

    @Transactional
    public CharacterResponse setFavorite(Long id, boolean favorite) {
        StoryCharacter c = find(id);
        c.setFavorite(favorite);
        repo.saveAndFlush(c);
        return get(id);
    }

    @Transactional
    public CharacterResponse setLinks(Long id, Map<String, String> links) {
        StoryCharacter c = find(id);
        for (var link : links.entrySet()) {
            if (!PROVIDERS.contains(link.getKey())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown provider " + link.getKey());
            }
            if (link.getValue() == null || link.getValue().isBlank()) c.getLinks().remove(link.getKey());
            else c.getLinks().put(link.getKey(), link.getValue().trim());
        }
        repo.saveAndFlush(c);
        return get(id);
    }

    @Transactional
    public CharacterResponse setPortrait(Long id, String contentType, byte[] bytes) throws IOException {
        StoryCharacter c = find(id);
        c.setPortrait(artwork.store("characters", String.valueOf(id), contentType, bytes));
        repo.saveAndFlush(c);
        return get(id);
    }

    public CharacterResponse setPortraitFromUrl(Long id, String url) throws IOException, InterruptedException {
        find(id);
        ArtworkService.Downloaded d = artwork.fetch(url);
        return setPortrait(id, d.contentType(), d.bytes());
    }

    @Transactional
    public void delete(Long id) throws IOException {
        StoryCharacter c = find(id);
        appearances.deleteAll(appearances.findByCharacterId(id));
        for (var image : images.list(com.klavoie.dashboard.media.ImageService.Owner.character(id))) images.delete(image.id());
        repo.delete(c);
        artwork.remove(c.getPortrait());
    }

    List<CharacterResponse> withAppearances(List<StoryCharacter> characters) {
        if (characters.isEmpty()) return List.of();
        Map<Long, List<AppearanceView>> byCharacter = appearances.findViews(characters.stream().map(StoryCharacter::getId).toList())
                .stream().collect(Collectors.groupingBy(AppearanceView::characterId));
        return characters.stream().map(c -> CharacterResponse.from(c, byCharacter.getOrDefault(c.getId(), List.of()))).toList();
    }

    StoryCharacter find(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No character " + id));
    }

    private static String blankToNull(String s) { return s == null || s.isBlank() ? null : s.trim(); }
}

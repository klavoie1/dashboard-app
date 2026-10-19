package com.klavoie.dashboard.characters;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class CharacterService {

    private final CharacterRepository repo;

    CharacterService(CharacterRepository repo) { this.repo = repo; }

    @Transactional(readOnly = true)
    public List<CharacterResponse> list(Long franchiseId, Long mediaId) {
        List<StoryCharacter> found;
        if (franchiseId != null) found = repo.findByFranchise(franchiseId);
        else if (mediaId != null) found = repo.findByMedia(mediaId);
        else found = repo.findAll(Sort.by("name"));
        return found.stream().map(CharacterResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public CharacterResponse get(Long id) {
        return repo.findById(id).map(CharacterResponse::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No character " + id));
    }

    @Transactional
    public CharacterResponse create(CharacterRequest req) {
        StoryCharacter c = new StoryCharacter();
        c.setName(req.name());
        c.setRole(req.role());
        c.setPortrait(req.portrait());
        c.setAbout(req.about());
        c.setDetails(req.details());
        if (req.franchiseIds() != null) c.getFranchiseIds().addAll(req.franchiseIds());
        if (req.mediaIds() != null) c.getMediaIds().addAll(req.mediaIds());
        return CharacterResponse.from(repo.saveAndFlush(c));
    }
}

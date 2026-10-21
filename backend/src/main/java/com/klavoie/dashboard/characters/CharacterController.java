package com.klavoie.dashboard.characters;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
class CharacterController {

    private final CharacterService service;
    private final CastService cast;

    CharacterController(CharacterService service, CastService cast) {
        this.service = service;
        this.cast = cast;
    }

    @GetMapping("/characters")
    List<CharacterResponse> list(@RequestParam(required = false) Long franchiseId,
                                 @RequestParam(required = false) Long mediaId) {
        return service.list(franchiseId, mediaId);
    }

    @GetMapping("/characters/{id}")
    CharacterResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping("/characters")
    @ResponseStatus(HttpStatus.CREATED)
    CharacterResponse create(@Valid @RequestBody CharacterRequest req) { return service.create(req); }

    @PutMapping("/characters/{id}")
    CharacterResponse update(@PathVariable Long id, @Valid @RequestBody CharacterRequest req) { return service.update(id, req); }

    @PatchMapping("/characters/{id}/favorite")
    CharacterResponse favorite(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        return service.setFavorite(id, Boolean.TRUE.equals(body.get("favorite")));
    }

    // provider -> id; an empty id unlinks that provider
    @PutMapping("/characters/{id}/links")
    CharacterResponse links(@PathVariable Long id, @RequestBody Map<String, String> links) { return service.setLinks(id, links); }

    // Field suggestions and portraits to pick from, from the character's linked sources
    @PostMapping("/characters/{id}/suggest")
    CastService.CharacterSuggestions suggest(@PathVariable Long id) { return cast.suggest(id); }

    @PostMapping("/characters/{id}/portrait")
    CharacterResponse portrait(@PathVariable Long id, @RequestParam("file") MultipartFile file) throws IOException {
        return service.setPortrait(id, file.getContentType(), file.getBytes());
    }

    @PostMapping("/characters/{id}/portrait/from-url")
    CharacterResponse portraitFromUrl(@PathVariable Long id, @RequestBody Map<String, String> body)
            throws IOException, InterruptedException {
        return service.setPortraitFromUrl(id, body.get("url"));
    }

    @DeleteMapping("/characters/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@PathVariable Long id) throws IOException { service.delete(id); }

    // Adds or updates a title's whole cast from its linked sources
    @PostMapping("/media/{mediaId}/characters/fetch")
    CastService.CastResult fetchCast(@PathVariable Long mediaId) { return cast.fetchCast(mediaId); }
}

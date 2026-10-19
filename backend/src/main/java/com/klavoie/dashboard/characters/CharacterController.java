package com.klavoie.dashboard.characters;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/characters")
class CharacterController {

    private final CharacterService service;

    CharacterController(CharacterService service) { this.service = service; }

    @GetMapping
    List<CharacterResponse> list(@RequestParam(required = false) Long franchiseId,
                                 @RequestParam(required = false) Long mediaId) {
        return service.list(franchiseId, mediaId);
    }

    @GetMapping("/{id}")
    CharacterResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    CharacterResponse create(@Valid @RequestBody CharacterRequest req) { return service.create(req); }
}

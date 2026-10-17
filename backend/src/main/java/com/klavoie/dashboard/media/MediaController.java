package com.klavoie.dashboard.media;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/media")
class MediaController {

    private final MediaService service;

    MediaController(MediaService service) { this.service = service; }

    @GetMapping
    List<MediaResponse> list(@RequestParam(required = false) String kind) { return service.list(kind); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    MediaResponse create(@Valid @RequestBody MediaRequest req) { return service.create(req); }
}

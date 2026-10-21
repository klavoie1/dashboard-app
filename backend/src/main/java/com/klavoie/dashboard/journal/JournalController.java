package com.klavoie.dashboard.journal;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
class JournalController {

    private final JournalService service;

    JournalController(JournalService service) { this.service = service; }

    @GetMapping("/media/{mediaId}/journal")
    List<JournalResponse> list(@PathVariable Long mediaId, @RequestParam(required = false) Long episodeId) {
        return service.list(mediaId, episodeId);
    }

    @PostMapping("/media/{mediaId}/journal")
    @ResponseStatus(HttpStatus.CREATED)
    JournalResponse create(@PathVariable Long mediaId, @Valid @RequestBody JournalRequest req) {
        return service.create(mediaId, req);
    }

    @GetMapping("/journal/recent")
    List<RecentEntry> recent(@RequestParam(defaultValue = "3") int limit) {
        return service.recent(Math.min(Math.max(limit, 1), 1000));
    }

    @PutMapping("/journal/{id}")
    JournalResponse update(@PathVariable Long id, @Valid @RequestBody JournalRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/journal/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@PathVariable Long id) { service.delete(id); }
}

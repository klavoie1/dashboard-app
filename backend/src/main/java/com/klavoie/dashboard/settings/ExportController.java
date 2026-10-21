package com.klavoie.dashboard.settings;

import com.klavoie.dashboard.characters.CharacterService;
import com.klavoie.dashboard.journal.JournalService;
import com.klavoie.dashboard.media.MediaService;
import com.klavoie.dashboard.reviews.ReviewService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

// Everything you've tracked as one JSON file: titles with their episodes, notes and reviews, and characters.
// Images aren't included; they're plain files in MEDIA_ROOT, so back that folder up alongside this.
// API keys are left out on purpose.
@RestController
class ExportController {

    private final MediaService media;
    private final CharacterService characters;
    private final JournalService journal;
    private final ReviewService reviews;

    ExportController(MediaService media, CharacterService characters, JournalService journal, ReviewService reviews) {
        this.media = media;
        this.characters = characters;
        this.journal = journal;
        this.reviews = reviews;
    }

    @GetMapping("/api/export")
    ResponseEntity<Map<String, Object>> export() {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("exportedOn", LocalDate.now().toString());
        out.put("titles", media.list(null).stream().map(m -> {
            Map<String, Object> title = new LinkedHashMap<>();
            title.put("title", media.get(m.id()));
            if ("anime".equals(m.kind()) || "tv".equals(m.kind())) title.put("episodes", media.listEpisodes(m.id()));
            title.put("notes", journal.list(m.id(), null));
            title.put("reviews", reviews.list(m.id()));
            return title;
        }).toList());
        out.put("characters", characters.list(null, null));
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"keeper-export-" + LocalDate.now() + ".json\"")
                .body(out);
    }
}

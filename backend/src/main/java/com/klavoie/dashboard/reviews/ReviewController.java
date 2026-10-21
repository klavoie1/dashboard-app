package com.klavoie.dashboard.reviews;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
class ReviewController {

    private final ReviewService service;

    ReviewController(ReviewService service) { this.service = service; }

    @GetMapping("/media/{mediaId}/reviews")
    List<ReviewResponse> list(@PathVariable Long mediaId) { return service.list(mediaId); }

    @PostMapping("/media/{mediaId}/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    ReviewResponse create(@PathVariable Long mediaId, @Valid @RequestBody ReviewRequest req) { return service.create(mediaId, req); }

    @GetMapping("/reviews/recent")
    List<RecentReview> recent(@RequestParam(defaultValue = "20") int limit) {
        return service.recent(Math.min(Math.max(limit, 1), 1000));
    }

    @PutMapping("/reviews/{id}")
    ReviewResponse update(@PathVariable Long id, @Valid @RequestBody ReviewRequest req) { return service.update(id, req); }

    @DeleteMapping("/reviews/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@PathVariable Long id) { service.delete(id); }
}

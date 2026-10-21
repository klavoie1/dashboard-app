package com.klavoie.dashboard.reviews;

import com.klavoie.dashboard.media.MediaService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReviewService {

    private final ReviewRepository repo;
    private final MediaService media;

    ReviewService(ReviewRepository repo, MediaService media) {
        this.repo = repo;
        this.media = media;
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> list(Long mediaId) {
        media.get(mediaId);
        return repo.findByMediaIdOrderByWrittenOnDescIdDesc(mediaId).stream().map(ReviewResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<RecentReview> recent(int limit) {
        return repo.findRecent(org.springframework.data.domain.PageRequest.of(0, limit));
    }

    @Transactional
    public ReviewResponse create(Long mediaId, ReviewRequest req) {
        media.get(mediaId);
        Review r = new Review();
        r.setMediaId(mediaId);
        apply(r, req);
        return ReviewResponse.from(repo.saveAndFlush(r));
    }

    @Transactional
    public ReviewResponse update(Long id, ReviewRequest req) {
        Review r = find(id);
        apply(r, req);
        return ReviewResponse.from(repo.saveAndFlush(r));
    }

    @Transactional
    public void delete(Long id) { repo.delete(find(id)); }

    private void apply(Review r, ReviewRequest req) {
        r.setHeadline(req.headline() == null || req.headline().isBlank() ? null : req.headline().trim());
        r.setBody(req.body().trim());
        r.setRating(req.rating());
        r.setSpoilers(Boolean.TRUE.equals(req.spoilers()));
        r.setWrittenOn(req.writtenOn() != null ? req.writtenOn() : r.getWrittenOn() != null ? r.getWrittenOn() : LocalDate.now().toString());
        r.setUpdatedAt(LocalDateTime.now().withNano(0).toString().replace('T', ' '));
    }

    private Review find(Long id) {
        return repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No review " + id));
    }
}

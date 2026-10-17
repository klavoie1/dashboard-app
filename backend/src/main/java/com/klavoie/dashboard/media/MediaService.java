package com.klavoie.dashboard.media;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MediaService {

    static final String DEFAULT_STATUS = "want";
    static final String STATUS_PATTERN = "want|in-progress|finished|paused|dropped";
    static final String KIND_PATTERN = "manga|anime|tv|movie|book|light-novel|game|audiobook";

    private final MediaRepository repo;

    MediaService(MediaRepository repo) { this.repo = repo; }

    @Transactional(readOnly = true)
    public List<MediaResponse> list(String kind) {
        List<Media> media = kind == null ? repo.findAll(Sort.by("title")) : repo.findByKindOrderByTitle(kind);
        return media.stream().map(MediaResponse::from).toList();
    }

    @Transactional
    public MediaResponse create(MediaRequest req) {
        Media m = new Media();
        m.setKind(req.kind());
        m.setTitle(req.title());
        m.setSeriesId(req.seriesId());
        m.setNumber(req.number());
        m.setStatus(req.status() == null ? DEFAULT_STATUS : req.status());
        m.setRating(req.rating());
        m.setDetails(req.details());
        return MediaResponse.from(repo.save(m));
    }
}

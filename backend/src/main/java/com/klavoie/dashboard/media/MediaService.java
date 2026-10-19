package com.klavoie.dashboard.media;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collection;
import java.util.List;
import java.util.Set;

@Service
public class MediaService {

    static final String DEFAULT_STATUS = "want";
    static final String STATUS_PATTERN = "want|in-progress|finished|paused|dropped";
    static final String KIND_PATTERN = "manga|anime|tv|movie|book|light-novel|game|audiobook";
    static final Set<String> EPISODIC_KINDS = Set.of("anime", "tv");

    private final MediaRepository repo;
    private final EpisodeRepository episodes;

    MediaService(MediaRepository repo, EpisodeRepository episodes) {
        this.repo = repo;
        this.episodes = episodes;
    }

    @Transactional(readOnly = true)
    public List<MediaResponse> list(String kind) {
        List<Media> media = kind == null ? repo.findAll(Sort.by("title")) : repo.findByKindOrderByTitle(kind);
        return media.stream().map(MediaResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<MediaResponse> listBySeries(Collection<Long> seriesIds) {
        if (seriesIds.isEmpty()) return List.of();
        return repo.findBySeriesIdInOrderByNumber(seriesIds).stream().map(MediaResponse::from).toList();
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

    @Transactional(readOnly = true)
    public List<EpisodeResponse> listEpisodes(Long mediaId) {
        findEpisodic(mediaId);
        return episodes.findByMediaIdOrderByNumber(mediaId).stream().map(EpisodeResponse::from).toList();
    }

    @Transactional
    public EpisodeResponse addEpisode(Long mediaId, EpisodeRequest req) {
        findEpisodic(mediaId);
        Episode e = new Episode();
        e.setMediaId(mediaId);
        e.setNumber(req.number());
        e.setTitle(req.title());
        e.setAirDate(req.airDate());
        e.setViews(req.views() == null ? 0 : req.views());
        e.setRating(req.rating());
        e.setSummary(req.summary());
        e.setNotes(req.notes());
        return EpisodeResponse.from(episodes.saveAndFlush(e));
    }

    // Only anime and tv seasons have episodes.
    private Media findEpisodic(Long mediaId) {
        Media m = repo.findById(mediaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No media " + mediaId));
        if (!EPISODIC_KINDS.contains(m.getKind())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, m.getKind() + " has no episodes");
        }
        return m;
    }
}

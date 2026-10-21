package com.klavoie.dashboard.media;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class MediaService {

    static final String DEFAULT_STATUS = "want";
    static final String STATUS_PATTERN = "want|in-progress|finished|paused|dropped";
    static final String KIND_PATTERN = "manga|anime|tv|movie|book|light-novel|game|audiobook";
    // Fields a fetch can fill or suggest, and so can be locked
    static final String LOCKABLE_PATTERN =
            "title|originalTitle|creator|releaseYear|endYear|format|synopsis|total|unitMinutes|tags|cover|backdrop";
    static final String UNIT_PATTERN = "episodes|pages|volumes|chapters|minutes|percent";
    static final String PROVIDER_PATTERN = "myanimelist|anilist|mangabaka|tmdb|igdb|tvmaze|openlibrary|kitsu|mangadex";
    static final Set<String> PROVIDERS = Set.of(PROVIDER_PATTERN.split("\\|"));
    static final Set<String> EPISODIC_KINDS = Set.of("anime", "tv");

    private final MediaRepository repo;
    private final EpisodeRepository episodes;
    private final GalleryImageRepository images;
    private final ArtworkService artwork;

    MediaService(MediaRepository repo, EpisodeRepository episodes, GalleryImageRepository images, ArtworkService artwork) {
        this.repo = repo;
        this.episodes = episodes;
        this.images = images;
        this.artwork = artwork;
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
        apply(m, req);
        return MediaResponse.from(repo.save(m));
    }

    @Transactional(readOnly = true)
    public MediaDetail get(Long id) {
        return detail(find(id));
    }

    @Transactional
    public MediaDetail update(Long id, MediaRequest req) {
        Media m = find(id);
        apply(m, req);
        return detail(repo.saveAndFlush(m));
    }

    @Transactional
    public MediaDetail logProgress(Long id, ProgressRequest req) {
        Media m = find(id);
        if (m.getTotal() != null && req.progress() > m.getTotal()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Progress is past the total of " + m.getTotal());
        }
        m.setProgress(req.progress());
        if (req.hoursPlayed() != null) m.setHoursPlayed(req.hoursPlayed());
        String today = LocalDate.now().toString();
        if (m.getStartedOn() == null && req.progress() > 0) m.setStartedOn(today);
        m.setLastActivityOn(today);
        // Moves out of "want" once you start, and to "finished" when you reach the end
        if (DEFAULT_STATUS.equals(m.getStatus()) && req.progress() > 0) changeStatus(m, "in-progress");
        if (m.getTotal() != null && req.progress().equals(m.getTotal())) changeStatus(m, "finished");
        // Stepping back from the end reopens it
        else if ("finished".equals(m.getStatus()) && m.getTotal() != null && req.progress() < m.getTotal()) changeStatus(m, "in-progress");
        return detail(repo.saveAndFlush(m));
    }

    @Transactional
    public MediaDetail setLinks(Long id, Map<String, String> links) {
        Media m = find(id);
        for (var link : links.entrySet()) {
            if (!PROVIDERS.contains(link.getKey())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown provider " + link.getKey());
            }
            if (link.getValue() == null || link.getValue().isBlank()) m.getLinks().remove(link.getKey());
            else m.getLinks().put(link.getKey(), link.getValue().trim());
        }
        return detail(repo.saveAndFlush(m));
    }

    @Transactional
    public MediaDetail setMilestones(Long id, List<MilestoneRequest> milestones) {
        Media m = find(id);
        m.getMilestones().clear();
        milestones.forEach(x -> m.getMilestones().add(new Milestone(x.label(), x.done())));
        return detail(repo.saveAndFlush(m));
    }

    private void apply(Media m, MediaRequest req) {
        m.setKind(req.kind());
        m.setTitle(req.title());
        m.setSeriesId(req.seriesId());
        m.setNumber(req.number());
        changeStatus(m, req.status() == null ? DEFAULT_STATUS : req.status());
        m.setRating(req.rating());
        m.setDetails(req.details());
        m.setSubtitle(req.subtitle());
        m.setOriginalTitle(req.originalTitle());
        m.setCreator(req.creator());
        m.setReleaseYear(req.releaseYear());
        m.setEndYear(req.endYear());
        m.setFormat(req.format());
        m.setAgeRating(req.ageRating());
        m.setSynopsis(req.synopsis());
        m.setCover(req.cover());
        m.setBackdrop(req.backdrop());
        m.setBackdropPosition(req.backdropPosition());
        m.setTotal(req.total());
        m.setProgressUnit(req.progressUnit());
        m.setUnitMinutes(req.unitMinutes());
        if (req.lockedFields() != null) m.setLockedFields(req.lockedFields());
        m.getTags().clear();
        if (req.tags() != null) req.tags().stream().map(String::trim).filter(t -> !t.isEmpty()).forEach(m.getTags()::add);
    }

    // For other services in this package that already hold the entity
    MediaDetail detailOf(Media m) { return detail(m); }

    @Transactional
    public MediaDetail setArtwork(Long id, String slot, String path) {
        Media m = find(id);
        if (slot.equals("cover")) m.setCover(path);
        else m.setBackdrop(path);
        return detail(repo.saveAndFlush(m));
    }

    // Records when a title was finished, for yearly goals
    private static void changeStatus(Media m, String status) {
        if ("finished".equals(status) && !"finished".equals(m.getStatus())) m.setFinishedOn(LocalDate.now().toString());
        if (!"finished".equals(status)) m.setFinishedOn(null);
        m.setStatus(status);
    }

    @Transactional(readOnly = true)
    public List<UpcomingEpisode> upcoming(int limit) {
        return episodes.findUpcoming(LocalDate.now().toString(), org.springframework.data.domain.PageRequest.of(0, limit));
    }

    // Removes the title and every file stored for it: artwork, gallery and episode screenshots
    @Transactional
    public void delete(Long id) {
        Media m = find(id);
        List<String> files = new java.util.ArrayList<>(images.findByMediaId(id).stream().map(GalleryImage::getPath).toList());
        files.add(m.getCover());
        files.add(m.getBackdrop());
        repo.delete(m);
        repo.flush();
        for (String path : files) {
            try {
                artwork.remove(path);
            } catch (java.io.IOException e) {
                // A file that can't be removed doesn't stop the title being deleted
            }
        }
    }

    private MediaDetail detail(Media m) {
        List<MediaResponse> siblings = m.getSeriesId() == null ? List.of()
                : listBySeries(List.of(m.getSeriesId())).stream().filter(s -> !s.id().equals(m.getId())).toList();
        return MediaDetail.from(m, siblings);
    }

    private Media find(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No media " + id));
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
        e.setSeason(req.season());
        e.setSeasonNumber(req.seasonNumber());
        e.setTitle(req.title());
        e.setAirDate(req.airDate());
        e.setMinutes(req.minutes());
        e.setViews(req.views() == null ? 0 : req.views());
        e.setRating(req.rating());
        e.setHeadline(req.headline());
        e.setSummary(req.summary());
        e.setRecap(req.recap());
        e.setNotes(req.notes());
        return EpisodeResponse.from(episodes.saveAndFlush(e));
    }

    @Transactional(readOnly = true)
    public EpisodeResponse getEpisode(Long mediaId, Double number) {
        return EpisodeResponse.from(findEpisode(mediaId, number));
    }

    @Transactional
    public EpisodeResponse updateEpisode(Long mediaId, Double number, EpisodeUpdate req) {
        Episode e = findEpisode(mediaId, number);
        if (req.watchedOn() != null) e.setWatchedOn(req.watchedOn());
        if (req.rating() != null) e.setRating(req.rating());
        if (req.views() != null) e.setViews(req.views());
        if (req.favorite() != null) e.setFavorite(req.favorite());
        if (req.notes() != null) e.setNotes(req.notes());
        return EpisodeResponse.from(episodes.saveAndFlush(e));
    }

    private Episode findEpisode(Long mediaId, Double number) {
        findEpisodic(mediaId);
        return episodes.findByMediaIdAndNumber(mediaId, number)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No episode " + number));
    }

    // Only anime and tv seasons have episodes.
    private Media findEpisodic(Long mediaId) {
        Media m = find(mediaId);
        if (!EPISODIC_KINDS.contains(m.getKind())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, m.getKind() + " has no episodes");
        }
        return m;
    }
}

package com.klavoie.dashboard.franchise;

import com.klavoie.dashboard.characters.CharacterService;
import com.klavoie.dashboard.media.MediaResponse;
import com.klavoie.dashboard.media.MediaService;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class FranchiseService {

    private final FranchiseRepository repo;
    private final SeriesRepository seriesRepo;
    private final MediaService media;
    private final CharacterService characters;

    FranchiseService(FranchiseRepository repo, SeriesRepository seriesRepo, MediaService media,
                     CharacterService characters) {
        this.repo = repo;
        this.seriesRepo = seriesRepo;
        this.media = media;
        this.characters = characters;
    }

    @Transactional(readOnly = true)
    public List<FranchiseResponse> list() {
        return repo.findAll(Sort.by("title")).stream().map(FranchiseResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public FranchiseDetail get(Long id) {
        Franchise f = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No franchise " + id));
        List<Series> series = seriesRepo.findByFranchiseIdOrderByKind(id);
        Map<Long, List<MediaResponse>> mediaBySeries = media.listBySeries(series.stream().map(Series::getId).toList())
                .stream().collect(Collectors.groupingBy(MediaResponse::seriesId));
        List<SeriesResponse> seriesWithMedia = series.stream()
                .map(s -> SeriesResponse.from(s, mediaBySeries.getOrDefault(s.getId(), List.of())))
                .toList();
        return new FranchiseDetail(f.getId(), f.getTitle(), f.getAltTitle(), f.getNotes(),
                seriesWithMedia, characters.list(id, null));
    }

    @Transactional
    public FranchiseResponse create(FranchiseRequest req) {
        Franchise f = new Franchise();
        f.setTitle(req.title());
        f.setAltTitle(req.altTitle());
        f.setNotes(req.notes());
        return FranchiseResponse.from(repo.save(f));
    }

    @Transactional
    public SeriesResponse createSeries(SeriesRequest req) {
        Series s = new Series();
        s.setTitle(req.title());
        s.setKind(req.kind());
        s.setStatus(req.status());
        s.setFranchiseId(req.franchiseId());
        return SeriesResponse.from(seriesRepo.saveAndFlush(s), List.of());
    }
}

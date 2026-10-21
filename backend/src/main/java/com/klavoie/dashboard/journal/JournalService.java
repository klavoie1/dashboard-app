package com.klavoie.dashboard.journal;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
public class JournalService {

    private final JournalRepository repo;

    JournalService(JournalRepository repo) { this.repo = repo; }

    @Transactional(readOnly = true)
    public List<JournalResponse> list(Long mediaId, Long episodeId) {
        List<JournalEntry> entries = episodeId == null
                ? repo.findByMediaIdOrderByWrittenOnDescIdDesc(mediaId)
                : repo.findByMediaIdAndEpisodeIdOrderByWrittenOnDescIdDesc(mediaId, episodeId);
        return entries.stream().map(JournalResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<RecentEntry> recent(int limit) {
        return repo.findRecent(org.springframework.data.domain.PageRequest.of(0, limit));
    }

    @Transactional
    public JournalResponse create(Long mediaId, JournalRequest req) {
        JournalEntry j = new JournalEntry();
        j.setMediaId(mediaId);
        apply(j, req);
        return JournalResponse.from(repo.saveAndFlush(j));
    }

    @Transactional
    public JournalResponse update(Long id, JournalRequest req) {
        JournalEntry j = find(id);
        apply(j, req);
        return JournalResponse.from(repo.saveAndFlush(j));
    }

    @Transactional
    public void delete(Long id) {
        repo.delete(find(id));
    }

    private void apply(JournalEntry j, JournalRequest req) {
        j.setEpisodeId(req.episodeId());
        j.setQuote(req.quote());
        j.setReflection(req.reflection());
        j.setWrittenOn(req.writtenOn() == null ? LocalDate.now().toString() : req.writtenOn());
    }

    private JournalEntry find(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No journal entry " + id));
    }
}

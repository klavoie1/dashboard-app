package com.klavoie.dashboard.franchise;

import com.klavoie.dashboard.media.MediaResponse;

import java.util.List;

public record SeriesResponse(Long id, String title, String kind, String status, Long franchiseId,
                             List<MediaResponse> media) {

    static SeriesResponse from(Series s, List<MediaResponse> media) {
        return new SeriesResponse(s.getId(), s.getTitle(), s.getKind(), s.getStatus(), s.getFranchiseId(), media);
    }
}

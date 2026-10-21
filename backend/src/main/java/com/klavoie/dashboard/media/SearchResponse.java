package com.klavoie.dashboard.media;

import com.klavoie.dashboard.providers.SearchHit;

import java.util.List;
import java.util.Map;

// mediaId is set when that result is already in the library. problems: provider -> why it wasn't searched.
public record SearchResponse(List<Result> results, Map<String, String> problems) {

    public record Result(SearchHit hit, Long mediaId) {}
}

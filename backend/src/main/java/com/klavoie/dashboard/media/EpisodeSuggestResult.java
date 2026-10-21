package com.klavoie.dashboard.media;

import com.klavoie.dashboard.providers.ImageOption;

import java.util.List;
import java.util.Map;

// episode already has a fresh community score; suggestions and stills are only used if you pick them.
public record EpisodeSuggestResult(EpisodeResponse episode, List<Suggestion> suggestions, List<ImageOption> stills,
                                   Map<String, String> problems) {}

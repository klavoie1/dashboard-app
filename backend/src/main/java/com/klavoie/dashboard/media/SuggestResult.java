package com.klavoie.dashboard.media;

import java.util.List;
import java.util.Map;

// media already has fresh ratings and episodes; suggestions are only applied if you accept them.
public record SuggestResult(MediaDetail media, List<Suggestion> suggestions, Map<String, String> problems) {}

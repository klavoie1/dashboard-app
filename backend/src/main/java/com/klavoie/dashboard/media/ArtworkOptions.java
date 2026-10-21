package com.klavoie.dashboard.media;

import com.klavoie.dashboard.providers.ImageOption;

import java.util.List;
import java.util.Map;

// Images to choose from, largest first, with why any source couldn't be asked.
public record ArtworkOptions(List<ImageOption> options, Map<String, String> problems) {}

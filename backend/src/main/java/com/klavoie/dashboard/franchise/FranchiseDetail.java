package com.klavoie.dashboard.franchise;

import com.klavoie.dashboard.characters.CharacterResponse;

import java.util.List;

// Everything on a franchise page: each format with its media, plus the characters.
public record FranchiseDetail(Long id, String title, String altTitle, String notes,
                              List<SeriesResponse> series, List<CharacterResponse> characters) {}

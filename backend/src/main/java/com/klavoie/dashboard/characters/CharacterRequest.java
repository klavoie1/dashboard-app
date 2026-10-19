package com.klavoie.dashboard.characters;

import jakarta.validation.constraints.NotBlank;

import java.util.Set;

public record CharacterRequest(
        @NotBlank String name,
        String role,
        String portrait,
        String about,
        String details,
        Set<Long> franchiseIds,
        Set<Long> mediaIds
) {}

package com.klavoie.dashboard.characters;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import java.util.List;
import java.util.Set;

// Creates a character, or saves the edit dialog (a full replace). Lists left out keep their current values.
public record CharacterRequest(
        @NotBlank String name,
        String nativeName,
        String role,
        String portrait,
        String about,
        String details,
        Boolean favorite,
        Set<Long> franchiseIds,
        Set<Long> mediaIds,
        List<@Pattern(regexp = CharacterService.LOCKABLE_PATTERN) String> lockedFields
) {}

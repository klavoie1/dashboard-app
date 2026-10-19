package com.klavoie.dashboard.characters;

import java.util.List;

public record CharacterResponse(
        Long id,
        String name,
        String role,
        String portrait,
        String about,
        String details,
        List<Long> franchiseIds,
        List<Long> mediaIds) {

    static CharacterResponse from(StoryCharacter c) {
        return new CharacterResponse(c.getId(), c.getName(), c.getRole(), c.getPortrait(), c.getAbout(),
                c.getDetails(), c.getFranchiseIds().stream().sorted().toList(),
                c.getMediaIds().stream().sorted().toList());
    }
}

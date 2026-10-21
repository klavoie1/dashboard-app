package com.klavoie.dashboard.characters;

import java.util.List;
import java.util.Map;

public record CharacterResponse(
        Long id,
        String name,
        String nativeName,
        String role,
        String portrait,
        String about,
        String details,
        Boolean favorite,
        List<Long> franchiseIds,
        List<Long> mediaIds,
        List<String> lockedFields,
        Map<String, String> links,
        List<AppearanceView> appearances) {

    static CharacterResponse from(StoryCharacter c, List<AppearanceView> appearances) {
        return new CharacterResponse(c.getId(), c.getName(), c.getNativeName(), c.getRole(), c.getPortrait(), c.getAbout(),
                c.getDetails(), c.getFavorite(), c.getFranchiseIds().stream().sorted().toList(),
                appearances.stream().map(AppearanceView::mediaId).sorted().toList(),
                c.getLockedFields().stream().sorted().toList(), Map.copyOf(c.getLinks()), appearances);
    }
}

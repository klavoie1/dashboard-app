package com.klavoie.dashboard.characters;

// An appearance with the title's name, type and cover, for cards and the character page.
public record AppearanceView(Long characterId, Long mediaId, String mediaTitle, String mediaKind, String mediaCover,
                             String role, String actor, String actorLanguage, Integer position) {}

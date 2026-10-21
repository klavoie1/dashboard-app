package com.klavoie.dashboard.providers;

import java.util.Map;

// A character as one provider describes it. role is MAIN, SUPPORTING or BACKGROUND for the title it came from;
// actor is the voice actor (anime) or the person playing them (tv, film). Any field can be null.
public record FetchedCharacter(
        String externalId,
        String name,
        String nativeName,
        String role,
        String description,
        String imageUrl,
        String actor,
        String actorLanguage,
        Map<String, String> details
) {}

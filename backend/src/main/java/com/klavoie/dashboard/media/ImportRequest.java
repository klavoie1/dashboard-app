package com.klavoie.dashboard.media;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

// Adds a provider search result to the library.
public record ImportRequest(
        @NotBlank @Pattern(regexp = MediaService.PROVIDER_PATTERN) String provider,
        @NotBlank String externalId,
        @NotBlank @Pattern(regexp = MediaService.KIND_PATTERN) String kind,
        @NotBlank String title
) {}

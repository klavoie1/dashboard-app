package com.klavoie.dashboard.reviews;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ReviewRequest(
        String headline,
        @NotBlank String body,
        @DecimalMin("1") @DecimalMax("10") Double rating,
        Boolean spoilers,
        @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2}") String writtenOn
) {}

package com.klavoie.dashboard.media;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import java.util.List;

// Used to create a title and to save the edit dialog (a full replace, so send every field).
public record MediaRequest(
        @NotBlank @Pattern(regexp = MediaService.KIND_PATTERN) String kind,
        @NotBlank String title,
        Long seriesId,
        Double number,
        @Pattern(regexp = MediaService.STATUS_PATTERN) String status,
        @DecimalMin("0") @DecimalMax("10") Double rating,
        String details,
        String subtitle,
        String originalTitle,
        String creator,
        Integer releaseYear,
        Integer endYear,
        String format,
        String ageRating,
        String synopsis,
        String cover,
        String backdrop,
        String backdropPosition,
        @Min(0) Double total,
        @Pattern(regexp = MediaService.UNIT_PATTERN) String progressUnit,
        @Min(1) Integer unitMinutes,
        List<String> tags,
        // Fields fetching must leave alone; null keeps the current locks
        List<@Pattern(regexp = MediaService.LOCKABLE_PATTERN) String> lockedFields
) {}

package com.klavoie.dashboard.media;

import jakarta.validation.constraints.NotBlank;

public record MilestoneRequest(@NotBlank String label, boolean done) {}

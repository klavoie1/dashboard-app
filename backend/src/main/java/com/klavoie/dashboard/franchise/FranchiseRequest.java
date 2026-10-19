package com.klavoie.dashboard.franchise;

import jakarta.validation.constraints.NotBlank;

public record FranchiseRequest(@NotBlank String title, String altTitle, String notes) {}

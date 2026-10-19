package com.klavoie.dashboard.franchise;

public record FranchiseResponse(Long id, String title, String altTitle, String notes) {

    static FranchiseResponse from(Franchise f) {
        return new FranchiseResponse(f.getId(), f.getTitle(), f.getAltTitle(), f.getNotes());
    }
}

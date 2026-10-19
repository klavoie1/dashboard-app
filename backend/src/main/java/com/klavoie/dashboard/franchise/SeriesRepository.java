package com.klavoie.dashboard.franchise;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

interface SeriesRepository extends JpaRepository<Series, Long> {
    List<Series> findByFranchiseIdOrderByKind(Long franchiseId);
}

package com.klavoie.dashboard.franchise;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
class FranchiseController {

    private final FranchiseService service;

    FranchiseController(FranchiseService service) { this.service = service; }

    @GetMapping("/franchises")
    List<FranchiseResponse> list() { return service.list(); }

    @GetMapping("/franchises/{id}")
    FranchiseDetail get(@PathVariable Long id) { return service.get(id); }

    @PostMapping("/franchises")
    @ResponseStatus(HttpStatus.CREATED)
    FranchiseResponse create(@Valid @RequestBody FranchiseRequest req) { return service.create(req); }

    @PostMapping("/series")
    @ResponseStatus(HttpStatus.CREATED)
    SeriesResponse createSeries(@Valid @RequestBody SeriesRequest req) { return service.createSeries(req); }
}

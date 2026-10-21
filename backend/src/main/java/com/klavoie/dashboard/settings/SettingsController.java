package com.klavoie.dashboard.settings;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/settings")
class SettingsController {

    private final SettingsService service;

    SettingsController(SettingsService service) { this.service = service; }

    @GetMapping
    List<SettingResponse> list() { return service.list(); }

    @PutMapping
    List<SettingResponse> update(@RequestBody Map<String, String> values) { return service.update(values); }
}

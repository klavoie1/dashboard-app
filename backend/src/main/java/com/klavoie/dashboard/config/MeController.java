package com.klavoie.dashboard.config;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

// Who is signed in, for the greeting and the avatar
@RestController
class MeController {

    record Me(String username) {}

    @GetMapping("/api/me")
    Me me(Principal principal) { return new Me(principal.getName()); }
}

package com.klavoie.dashboard;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.hasItems;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class FranchiseApiTest {

    @Autowired
    MockMvc mvc;

    @Test
    @WithMockUser
    void franchiseGroupsMangaAndAnimeWithCharacters() throws Exception {
        mvc.perform(get("/api/franchises/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Starfall Chronicles"))
                .andExpect(jsonPath("$.series[*].kind", hasItems("manga", "anime")))
                .andExpect(jsonPath("$.series[?(@.kind == 'manga')].media[*].title",
                        hasItems("Starfall Chronicles Vol. 1", "Starfall Chronicles Vol. 2")))
                .andExpect(jsonPath("$.characters[*].name", hasItems("Kaito Venn", "Mira Solenne")));
    }

    @Test
    @WithMockUser
    void unknownFranchiseIs404() throws Exception {
        mvc.perform(get("/api/franchises/999")).andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser
    void createsSeriesInsideFranchise() throws Exception {
        mvc.perform(post("/api/series").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\": \"Starfall Chronicles\", \"kind\": \"light-novel\", \"franchiseId\": 1}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.franchiseId").value(1));
    }

    @Test
    @WithMockUser
    void rejectsSeriesInUnknownFranchise() throws Exception {
        mvc.perform(post("/api/series").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\": \"Nowhere\", \"kind\": \"manga\", \"franchiseId\": 999}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void needsLogin() throws Exception {
        mvc.perform(get("/api/franchises")).andExpect(status().isUnauthorized());
    }
}

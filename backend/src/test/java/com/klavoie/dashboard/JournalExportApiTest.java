package com.klavoie.dashboard;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class JournalExportApiTest {

    @Autowired
    MockMvc mvc;

    private long create(String url, String body) throws Exception {
        String json = mvc.perform(post(url).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(body))
                .andReturn().getResponse().getContentAsString();
        return JsonPath.<Number>read(json, "$.id").longValue();
    }

    @Test
    @WithMockUser(username = "reader")
    void knowsWhoIsSignedIn() throws Exception {
        mvc.perform(get("/api/me")).andExpect(jsonPath("$.username").value("reader"));
    }

    @Test
    @WithMockUser
    void journalShowsNotesAndReviewsWithTheirTitles() throws Exception {
        long media = create("/api/media", "{\"kind\": \"book\", \"title\": \"Journal book\"}");
        create("/api/media/" + media + "/journal", "{\"quote\": \"A line\", \"writtenOn\": \"2099-02-01\"}");
        create("/api/media/" + media + "/reviews", "{\"headline\": \"Loved it\", \"body\": \"Words.\", \"writtenOn\": \"2099-02-02\"}");
        mvc.perform(get("/api/journal/recent").param("limit", "1"))
                .andExpect(jsonPath("$[0].mediaTitle").value("Journal book"))
                .andExpect(jsonPath("$[0].mediaKind").value("book"));
        mvc.perform(get("/api/reviews/recent").param("limit", "1"))
                .andExpect(jsonPath("$[0].headline").value("Loved it"))
                .andExpect(jsonPath("$[0].mediaTitle").value("Journal book"));
    }

    @Test
    @WithMockUser
    void exportsEverythingAsAFile() throws Exception {
        create("/api/media", "{\"kind\": \"game\", \"title\": \"Exported\"}");
        mvc.perform(get("/api/export"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", containsString("keeper-export-")))
                .andExpect(jsonPath("$.titles[?(@.title.title == 'Exported')]").exists())
                .andExpect(jsonPath("$.characters").isArray());
    }

    @Test
    @WithMockUser
    void acceptsTheNewSourcesAsLinks() throws Exception {
        long media = create("/api/media", "{\"kind\": \"manga\", \"title\": \"Links\"}");
        mvc.perform(put("/api/media/" + media + "/links").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"kitsu\": \"46474\", \"mangadex\": \"not-a-uuid\"}"))
                .andExpect(jsonPath("$.links.kitsu").value("46474"));
        // A bad MangaDex id is explained without calling MangaDex; Kitsu is left out by removing its link first
        mvc.perform(put("/api/media/" + media + "/links").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"kitsu\": \"\"}"));
        mvc.perform(post("/api/media/" + media + "/suggest").with(csrf()))
                .andExpect(jsonPath("$.problems.mangadex").value(containsString("MangaDex ids look like")));
    }
}

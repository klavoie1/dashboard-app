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

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TitlePageApiTest {

    @Autowired
    MockMvc mvc;

    // A fresh title per test, so tests don't depend on each other's edits.
    // Avoids manga, since MediaApiTest counts the sample manga.
    private long newTitle(String kind, String extra) throws Exception {
        String json = mvc.perform(post("/api/media").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"kind\": \"" + kind + "\", \"title\": \"Test title\"" + extra + "}"))
                .andReturn().getResponse().getContentAsString();
        return JsonPath.<Number>read(json, "$.id").longValue();
    }

    @Test
    @WithMockUser
    void savesEverythingFromTheEditDialog() throws Exception {
        long id = newTitle("anime", "");
        mvc.perform(put("/api/media/" + id).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"kind": "anime", "title": "Frieren", "subtitle": "Beyond Journey's End",
                                 "releaseYear": 2023, "endYear": 2024, "synopsis": "An elf mage...",
                                 "total": 28, "progressUnit": "episodes", "unitMinutes": 24, "rating": 8.8,
                                 "tags": ["Fantasy", " Drama ", ""]}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subtitle").value("Beyond Journey's End"))
                .andExpect(jsonPath("$.rating").value(8.8))
                .andExpect(jsonPath("$.tags.length()").value(2));

        mvc.perform(get("/api/media/" + id))
                .andExpect(jsonPath("$.endYear").value(2024))
                .andExpect(jsonPath("$.tags[0]").value("Drama"));
    }

    @Test
    @WithMockUser
    void loggingProgressMovesTheStatusAlong() throws Exception {
        long id = newTitle("book", ", \"total\": 272, \"progressUnit\": \"pages\"");
        mvc.perform(patch("/api/media/" + id + "/progress").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"progress\": 88}"))
                .andExpect(jsonPath("$.status").value("in-progress"))
                .andExpect(jsonPath("$.startedOn").isNotEmpty());
        mvc.perform(patch("/api/media/" + id + "/progress").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"progress\": 272}"))
                .andExpect(jsonPath("$.status").value("finished"));
    }

    @Test
    @WithMockUser
    void rejectsProgressPastTheEnd() throws Exception {
        long id = newTitle("book", ", \"total\": 100, \"progressUnit\": \"pages\"");
        mvc.perform(patch("/api/media/" + id + "/progress").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"progress\": 101}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    void linksAndUnlinksProviders() throws Exception {
        long id = newTitle("light-novel", "");
        mvc.perform(put("/api/media/" + id + "/links").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"myanimelist\": \"126287\", \"anilist\": \"118586\"}"))
                .andExpect(jsonPath("$.links.myanimelist").value("126287"));
        mvc.perform(put("/api/media/" + id + "/links").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"anilist\": \"\"}"))
                .andExpect(jsonPath("$.links.anilist").doesNotExist())
                .andExpect(jsonPath("$.links.myanimelist").value("126287"));
    }

    @Test
    @WithMockUser
    void rejectsUnknownProvider() throws Exception {
        long id = newTitle("light-novel", "");
        mvc.perform(put("/api/media/" + id + "/links").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"imdb\": \"tt123\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    void keepsMilestonesInOrder() throws Exception {
        long id = newTitle("game", "");
        mvc.perform(put("/api/media/" + id + "/milestones").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("[{\"label\": \"Build the Everdoor\", \"done\": true}, {\"label\": \"Meet Gwen\", \"done\": false}]"))
                .andExpect(jsonPath("$.milestones[0].label").value("Build the Everdoor"))
                .andExpect(jsonPath("$.milestones[1].done").value(false));
    }

    @Test
    @WithMockUser
    void tracksOneEpisode() throws Exception {
        long id = newTitle("tv", "");
        mvc.perform(post("/api/media/" + id + "/episodes").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"number\": 12, \"season\": 2, \"seasonNumber\": 3, \"title\": \"Who Is Alive?\", \"minutes\": 55}"))
                .andExpect(status().isCreated());
        mvc.perform(patch("/api/media/" + id + "/episodes/12").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"watchedOn\": \"2026-10-16\", \"rating\": 8.5, \"favorite\": true}"))
                .andExpect(jsonPath("$.rating").value(8.5))
                .andExpect(jsonPath("$.favorite").value(true))
                .andExpect(jsonPath("$.season").value(2));
    }

    @Test
    @WithMockUser
    void writesJournalEntries() throws Exception {
        long id = newTitle("anime", "");
        mvc.perform(post("/api/media/" + id + "/journal").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quote\": \"Stark is already my favorite.\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.writtenOn").isNotEmpty());
        mvc.perform(get("/api/media/" + id + "/journal"))
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    @WithMockUser
    void listsOtherSeasonsInTheSameSeries() throws Exception {
        String json = mvc.perform(get("/api/media").param("kind", "anime")).andReturn().getResponse().getContentAsString();
        Number id = JsonPath.<java.util.List<Number>>read(json, "$[?(@.title == 'The Quiet Orbit')].id").get(0);
        mvc.perform(get("/api/media/" + id))
                .andExpect(jsonPath("$.siblings[0].title").value("The Quiet Orbit: Movie"));
    }
}

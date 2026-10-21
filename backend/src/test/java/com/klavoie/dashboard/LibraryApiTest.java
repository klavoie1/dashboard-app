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

import java.time.LocalDate;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class LibraryApiTest {

    @Autowired
    MockMvc mvc;

    private long newTitle(String kind, String extra) throws Exception {
        String json = mvc.perform(post("/api/media").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"kind\": \"" + kind + "\", \"title\": \"Test title\"" + extra + "}"))
                .andReturn().getResponse().getContentAsString();
        return JsonPath.<Number>read(json, "$.id").longValue();
    }

    // MangaBaka has no client, so importing from it never touches the network
    @Test
    @WithMockUser
    void importsOnceAndReturnsTheSameTitleAfter() throws Exception {
        String body = "{\"provider\": \"mangabaka\", \"externalId\": \"abc-1\", \"kind\": \"light-novel\", \"title\": \"Imported\"}";
        String first = mvc.perform(post("/api/media/import").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.media.title").value("Imported"))
                .andExpect(jsonPath("$.media.links.mangabaka").value("abc-1"))
                .andReturn().getResponse().getContentAsString();
        Number id = JsonPath.read(first, "$.media.id");
        mvc.perform(post("/api/media/import").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(jsonPath("$.media.id").value(id));
    }

    @Test
    @WithMockUser
    void recordsWhenATitleIsFinished() throws Exception {
        long id = newTitle("book", ", \"total\": 10, \"progressUnit\": \"pages\"");
        mvc.perform(patch("/api/media/" + id + "/progress").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"progress\": 10}"))
                .andExpect(jsonPath("$.finishedOn").value(LocalDate.now().toString()));
        mvc.perform(patch("/api/media/" + id + "/progress").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"progress\": 4}"))
                .andExpect(jsonPath("$.status").value("in-progress"))
                .andExpect(jsonPath("$.finishedOn").doesNotExist());
    }

    @Test
    @WithMockUser
    void listsEpisodesAiringSoonForTitlesYouFollow() throws Exception {
        long id = newTitle("tv", ", \"status\": \"in-progress\"");
        String soon = LocalDate.now().plusDays(2).toString();
        mvc.perform(post("/api/media/" + id + "/episodes").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"number\": 1, \"title\": \"Pilot\", \"airDate\": \"" + soon + "\"}"));
        mvc.perform(get("/api/media/upcoming"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.mediaId == " + id + ")].title").value("Pilot"));
    }

    @Test
    @WithMockUser
    void showsRecentNotesWithTheirTitle() throws Exception {
        long id = newTitle("game", "");
        mvc.perform(post("/api/media/" + id + "/journal").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"quote\": \"A note for the dashboard\", \"writtenOn\": \"2099-01-01\"}"));
        mvc.perform(get("/api/journal/recent").param("limit", "1"))
                .andExpect(jsonPath("$[0].quote").value("A note for the dashboard"))
                .andExpect(jsonPath("$[0].mediaTitle").value("Test title"));
    }

    @Test
    @WithMockUser
    void removesATitle() throws Exception {
        long id = newTitle("movie", "");
        mvc.perform(put("/api/media/" + id + "/links").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"tmdb\": \"1\"}"));
        mvc.perform(delete("/api/media/" + id).with(csrf())).andExpect(status().isNoContent());
        mvc.perform(get("/api/media/" + id)).andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser
    void imageProxyOnlyFetchesProviderImages() throws Exception {
        mvc.perform(get("/api/images").param("url", "https://example.com/a.png")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/images").param("url", "http://s4.anilist.co/a.png")).andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    void savesLockedFieldsAndRejectsUnknownOnes() throws Exception {
        long id = newTitle("anime", "");
        mvc.perform(put("/api/media/" + id).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"kind\": \"anime\", \"title\": \"Mine\", \"lockedFields\": [\"title\", \"synopsis\"]}"))
                .andExpect(jsonPath("$.lockedFields[0]").value("synopsis"))
                .andExpect(jsonPath("$.lockedFields[1]").value("title"));
        // Leaving lockedFields out keeps them
        mvc.perform(put("/api/media/" + id).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"kind\": \"anime\", \"title\": \"Mine\"}"))
                .andExpect(jsonPath("$.lockedFields.length()").value(2));
        mvc.perform(put("/api/media/" + id).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"kind\": \"anime\", \"title\": \"Mine\", \"lockedFields\": [\"status\"]}"))
                .andExpect(status().isBadRequest());
    }

    // MangaBaka has no client, so suggesting never touches the network
    @Test
    @WithMockUser
    void suggestsWithoutChangingFields() throws Exception {
        long id = newTitle("light-novel", "");
        mvc.perform(put("/api/media/" + id + "/links").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"mangabaka\": \"1\"}"));
        mvc.perform(post("/api/media/" + id + "/suggest").with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.suggestions.length()").value(0))
                .andExpect(jsonPath("$.media.title").value("Test title"))
                .andExpect(jsonPath("$.problems.mangabaka").exists());
    }

    @Test
    @WithMockUser
    void onlyDownloadsArtworkFromProviders() throws Exception {
        long id = newTitle("book", "");
        mvc.perform(post("/api/media/" + id + "/artwork/cover/from-url").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"url\": \"https://example.com/cover.jpg\"}"))
                .andExpect(status().isBadRequest());
    }
}

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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CharacterAndEpisodeApiTest {

    @Autowired
    MockMvc mvc;

    // Looks up a media id by title, since ids depend on insert order.
    private long mediaId(String title) throws Exception {
        String json = mvc.perform(get("/api/media")).andReturn().getResponse().getContentAsString();
        Number id = JsonPath.<java.util.List<Number>>read(json, "$[?(@.title == '" + title + "')].id").get(0);
        return id.longValue();
    }

    @Test
    @WithMockUser
    void listsCharactersAppearingInAMedia() throws Exception {
        mvc.perform(get("/api/characters").param("mediaId", String.valueOf(mediaId("Starfall Chronicles Vol. 1"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Kaito Venn"));
    }

    @Test
    @WithMockUser
    void createsCharacterLinkedToFranchiseAndMedia() throws Exception {
        long season = mediaId("Starfall Chronicles Season 1");
        mvc.perform(post("/api/characters").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"Captain Orrin\", \"role\": \"side\", \"franchiseIds\": [1], \"mediaIds\": [" + season + "]}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.franchiseIds[0]").value(1))
                .andExpect(jsonPath("$.mediaIds[0]").value(season));
    }

    @Test
    @WithMockUser
    void rejectsCharacterInUnknownFranchise() throws Exception {
        mvc.perform(post("/api/characters").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"Ghost\", \"franchiseIds\": [999]}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    void listsEpisodesInOrder() throws Exception {
        mvc.perform(get("/api/media/" + mediaId("Starfall Chronicles Season 1") + "/episodes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].title").value("The Falling Light"))
                .andExpect(jsonPath("$[0].views").value(2));
    }

    @Test
    @WithMockUser
    void addsEpisodeWithZeroViewsByDefault() throws Exception {
        mvc.perform(post("/api/media/" + mediaId("The Quiet Orbit") + "/episodes").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"number\": 1, \"title\": \"Liftoff\", \"airDate\": \"2025-04-06\", \"rating\": 9}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.views").value(0));
    }

    @Test
    @WithMockUser
    void rejectsDuplicateEpisodeNumber() throws Exception {
        mvc.perform(post("/api/media/" + mediaId("Starfall Chronicles Season 1") + "/episodes").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"number\": 1}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    void booksHaveNoEpisodes() throws Exception {
        mvc.perform(post("/api/media/" + mediaId("Letters on Calm") + "/episodes").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"number\": 1}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    void rejectsRatingOutsideOneToTen() throws Exception {
        mvc.perform(post("/api/media/" + mediaId("Starfall Chronicles Season 1") + "/episodes").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"number\": 4, \"rating\": 11}"))
                .andExpect(status().isBadRequest());
    }
}

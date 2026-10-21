package com.klavoie.dashboard;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.startsWith;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CharactersAndEpisodeEditApiTest {

    @Autowired
    MockMvc mvc;

    private long create(String url, String body) throws Exception {
        String json = mvc.perform(post(url).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(body))
                .andReturn().getResponse().getContentAsString();
        return JsonPath.<Number>read(json, "$.id").longValue();
    }

    @Test
    @WithMockUser
    void editsACharacterAndKeepsItsAppearances() throws Exception {
        long media = create("/api/media", "{\"kind\": \"game\", \"title\": \"Cast test\"}");
        long id = create("/api/characters", "{\"name\": \"Gwen\", \"mediaIds\": [" + media + "]}");
        mvc.perform(put("/api/characters/" + id).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"Gwen\", \"nativeName\": \"グウェン\", \"role\": \"Deer spirit\", \"about\": \"An old friend.\","
                                + " \"details\": \"[{\\\"label\\\":\\\"Age\\\",\\\"value\\\":\\\"Unknown\\\"}]\", \"lockedFields\": [\"about\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nativeName").value("グウェン"))
                .andExpect(jsonPath("$.lockedFields[0]").value("about"))
                .andExpect(jsonPath("$.appearances[0].mediaTitle").value("Cast test"))
                .andExpect(jsonPath("$.appearances[0].mediaKind").value("game"));
        mvc.perform(patch("/api/characters/" + id + "/favorite").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"favorite\": true}"))
                .andExpect(jsonPath("$.favorite").value(true));
        mvc.perform(get("/api/characters").param("mediaId", String.valueOf(media)))
                .andExpect(jsonPath("$[0].name").value("Gwen"));
    }

    @Test
    @WithMockUser
    void linksCharactersOnlyToKnownSources() throws Exception {
        long id = create("/api/characters", "{\"name\": \"Linked\"}");
        mvc.perform(put("/api/characters/" + id + "/links").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"anilist\": \"184286\"}"))
                .andExpect(jsonPath("$.links.anilist").value("184286"));
        mvc.perform(put("/api/characters/" + id + "/links").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"wiki\": \"x\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    void storesAPortraitAndRemovesTheCharacter() throws Exception {
        long id = create("/api/characters", "{\"name\": \"Portrait\"}");
        byte[] png = {(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1a, '\n'};
        mvc.perform(multipart("/api/characters/" + id + "/portrait")
                        .file(new MockMultipartFile("file", "p.png", "image/png", png)).with(csrf()))
                .andExpect(jsonPath("$.portrait").value(startsWith("/media/characters/" + id + ".png")));
        mvc.perform(delete("/api/characters/" + id).with(csrf())).andExpect(status().isNoContent());
        mvc.perform(get("/api/characters/" + id)).andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser
    void castFetchExplainsWhatToLink() throws Exception {
        long media = create("/api/media", "{\"kind\": \"book\", \"title\": \"No links\"}");
        mvc.perform(post("/api/media/" + media + "/characters/fetch").with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cast.length()").value(0))
                .andExpect(jsonPath("$.problems.sources").exists());
    }

    @Test
    @WithMockUser
    void editsAnEpisodeAndItsScreenshots() throws Exception {
        long media = create("/api/media", "{\"kind\": \"tv\", \"title\": \"Episode edit\"}");
        mvc.perform(post("/api/media/" + media + "/episodes").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"number\": 1, \"title\": \"Pilot\"}"));
        mvc.perform(put("/api/media/" + media + "/episodes/1").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\": \"Pilot (extended)\", \"summary\": \"It begins.\", \"minutes\": 61, \"lockedFields\": [\"title\"]}"))
                .andExpect(jsonPath("$.title").value("Pilot (extended)"))
                .andExpect(jsonPath("$.lockedFields[0]").value("title"));
        byte[] png = {(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1a, '\n'};
        String json = mvc.perform(multipart("/api/media/" + media + "/episodes/1/images")
                        .file(new MockMultipartFile("file", "s.png", "image/png", png)).param("caption", "Opening shot").with(csrf()))
                .andExpect(jsonPath("$.screenshots[0].caption").value("Opening shot"))
                .andReturn().getResponse().getContentAsString();
        Number imageId = JsonPath.read(json, "$.screenshots[0].id");
        mvc.perform(get("/api/media/" + media + "/episodes")).andExpect(jsonPath("$[0].screenshots.length()").value(1));
        mvc.perform(delete("/api/media/" + media + "/episodes/1/images/" + imageId).with(csrf()))
                .andExpect(jsonPath("$.screenshots.length()").value(0));
    }

    @Test
    @WithMockUser
    void artworkOptionsAreEmptyWithoutLinks() throws Exception {
        long media = create("/api/media", "{\"kind\": \"movie\", \"title\": \"Options\"}");
        mvc.perform(get("/api/media/" + media + "/artwork-options").param("slot", "backdrop"))
                .andExpect(jsonPath("$.options.length()").value(0));
        mvc.perform(get("/api/media/" + media + "/artwork-options").param("slot", "poster"))
                .andExpect(status().isBadRequest());
    }
}

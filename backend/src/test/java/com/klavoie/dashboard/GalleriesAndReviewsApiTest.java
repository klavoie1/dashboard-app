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
class GalleriesAndReviewsApiTest {

    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1a, '\n'};

    @Autowired
    MockMvc mvc;

    private long create(String url, String body) throws Exception {
        String json = mvc.perform(post(url).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(body))
                .andReturn().getResponse().getContentAsString();
        return JsonPath.<Number>read(json, "$.id").longValue();
    }

    @Test
    @WithMockUser
    void titleGalleryKeepsEpisodeScreenshotsSeparate() throws Exception {
        long media = create("/api/media", "{\"kind\": \"tv\", \"title\": \"Gallery show\"}");
        mvc.perform(post("/api/media/" + media + "/episodes").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"number\": 1}"));
        mvc.perform(multipart("/api/media/" + media + "/episodes/1/images")
                .file(new MockMultipartFile("file", "s.png", "image/png", PNG)).with(csrf()));
        String json = mvc.perform(multipart("/api/media/" + media + "/images")
                        .file(new MockMultipartFile("file", "g.png", "image/png", PNG)).param("caption", "Poster scan").with(csrf()))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].path").value(startsWith("/media/gallery/media-" + media)))
                .andReturn().getResponse().getContentAsString();
        Number id = JsonPath.read(json, "$[0].id");
        mvc.perform(patch("/api/images/" + id).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"caption\": \"Better caption\"}"))
                .andExpect(jsonPath("$.caption").value("Better caption"));
        mvc.perform(delete("/api/images/" + id).with(csrf())).andExpect(status().isNoContent());
        mvc.perform(get("/api/media/" + media + "/images")).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(get("/api/media/" + media + "/episodes/1")).andExpect(jsonPath("$.screenshots.length()").value(1));
    }

    @Test
    @WithMockUser
    void charactersHaveGalleries() throws Exception {
        long character = create("/api/characters", "{\"name\": \"Gallery person\"}");
        mvc.perform(multipart("/api/characters/" + character + "/images")
                        .file(new MockMultipartFile("file", "c.png", "image/png", PNG)).with(csrf()))
                .andExpect(jsonPath("$[0].path").value(startsWith("/media/gallery/character-" + character)));
        mvc.perform(delete("/api/characters/" + character).with(csrf())).andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser
    void writesEditsAndRemovesReviews() throws Exception {
        long media = create("/api/media", "{\"kind\": \"book\", \"title\": \"Reviewed\"}");
        long review = create("/api/media/" + media + "/reviews",
                "{\"headline\": \"A quiet triumph\", \"body\": \"Long thoughts.\", \"rating\": 9.5, \"spoilers\": true}");
        mvc.perform(put("/api/reviews/" + review).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"body\": \"Longer thoughts.\", \"rating\": 9}"))
                .andExpect(jsonPath("$.body").value("Longer thoughts."))
                .andExpect(jsonPath("$.headline").doesNotExist())
                .andExpect(jsonPath("$.writtenOn").isNotEmpty());
        mvc.perform(get("/api/media/" + media + "/reviews")).andExpect(jsonPath("$.length()").value(1));
        mvc.perform(post("/api/media/" + media + "/reviews").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"body\": \"\"}")).andExpect(status().isBadRequest());
        mvc.perform(delete("/api/reviews/" + review).with(csrf())).andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser
    void updatingEpisodesExplainsMissingSources() throws Exception {
        long show = create("/api/media", "{\"kind\": \"anime\", \"title\": \"No sources\"}");
        mvc.perform(post("/api/media/" + show + "/episodes/fetch").with(csrf()))
                .andExpect(jsonPath("$.added").value(0))
                .andExpect(jsonPath("$.problems.sources").exists());
        long book = create("/api/media", "{\"kind\": \"book\", \"title\": \"Not episodic\"}");
        mvc.perform(post("/api/media/" + book + "/episodes/fetch").with(csrf())).andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    void reportsWhereImagesAreStored() throws Exception {
        mvc.perform(get("/api/settings/storage"))
                .andExpect(jsonPath("$.path").value(org.hamcrest.Matchers.endsWith("test-media")))
                .andExpect(jsonPath("$.writable").value(true))
                .andExpect(jsonPath("$.folders.gallery").exists());
    }
}

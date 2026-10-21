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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SettingsAndRefreshApiTest {

    @Autowired
    MockMvc mvc;

    private long newTitle(String kind) throws Exception {
        String json = mvc.perform(post("/api/media").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"kind\": \"" + kind + "\", \"title\": \"Test title\"}"))
                .andReturn().getResponse().getContentAsString();
        return JsonPath.<Number>read(json, "$.id").longValue();
    }

    @Test
    @WithMockUser
    void savesKeysWithoutEverReturningThem() throws Exception {
        mvc.perform(put("/api/settings").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"mal-client-id\": \"secret-123\"}"))
                .andExpect(status().isOk());
        String json = mvc.perform(get("/api/settings")).andReturn().getResponse().getContentAsString();
        org.junit.jupiter.api.Assertions.assertFalse(json.contains("secret-123"));
        mvc.perform(get("/api/settings"))
                .andExpect(jsonPath("$[?(@.key == 'mal-client-id')].configured").value(true))
                .andExpect(jsonPath("$[?(@.key == 'mal-client-id')].source").value("saved"));

        mvc.perform(put("/api/settings").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"mal-client-id\": \"\"}"))
                .andExpect(jsonPath("$[?(@.key == 'mal-client-id')].configured").value(false));
    }

    @Test
    @WithMockUser
    void rejectsUnknownSetting() throws Exception {
        mvc.perform(put("/api/settings").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\": \"x\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    void refreshExplainsProvidersItCantUse() throws Exception {
        long id = newTitle("game");
        mvc.perform(put("/api/media/" + id + "/links").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"mangabaka\": \"123\", \"igdb\": \"456\"}"));
        mvc.perform(post("/api/media/" + id + "/refresh").with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.problems.mangabaka").value("Fetching from this provider isn't supported yet"))
                .andExpect(jsonPath("$.problems.igdb").value("Needs an API key in Settings"));
    }

    @Test
    @WithMockUser
    void storesUploadedCoverOnTheServer() throws Exception {
        long id = newTitle("book");
        // The 8-byte PNG signature is enough; the server checks the declared type, not the pixels
        byte[] png = {(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1a, '\n'};
        mvc.perform(multipart("/api/media/" + id + "/artwork/cover")
                        .file(new MockMultipartFile("file", "cover.png", "image/png", png)).with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cover").value(startsWith("/media/artwork/" + id + "-cover.png")));
    }

    @Test
    @WithMockUser
    void rejectsNonImageUploads() throws Exception {
        long id = newTitle("book");
        mvc.perform(multipart("/api/media/" + id + "/artwork/cover")
                        .file(new MockMultipartFile("file", "notes.txt", "text/plain", "hi".getBytes())).with(csrf()))
                .andExpect(status().isBadRequest());
    }
}

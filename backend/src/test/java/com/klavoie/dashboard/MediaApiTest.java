package com.klavoie.dashboard;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MediaApiTest {

    @Autowired
    MockMvc mvc;

    @Test
    @WithMockUser
    void listsSampleManga() throws Exception {
        mvc.perform(get("/api/media").param("kind", "manga"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void needsLogin() throws Exception {
        mvc.perform(get("/api/media")).andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser
    void defaultsStatusToWant() throws Exception {
        mvc.perform(post("/api/media").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"kind\": \"book\", \"title\": \"Untitled\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("want"));
    }

    @Test
    @WithMockUser
    void rejectsUnknownStatus() throws Exception {
        mvc.perform(post("/api/media").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"kind\": \"book\", \"title\": \"Untitled\", \"status\": \"to read\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    void acceptsKindType() throws Exception {
        mvc.perform(post("/api/media").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"kind\": \"light-novel\", \"title\": \"Untitled\", \"status\": \"want\"}"))
                .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser
    void rejectsUnknownKind() throws Exception {
        mvc.perform(post("/api/media").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"kind\": \"books\", \"title\": \"Untitled\", \"status\": \"want\"}"))
                .andExpect(status().isBadRequest());
    }
}

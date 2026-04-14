package com.sodam.userservice.config;

import com.sodam.userservice.security.CustomOAuth2UserService;
import com.sodam.userservice.security.OAuth2SuccessHandler;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.boot.autoconfigure.data.jpa.JpaRepositoriesAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizedClientRepository;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(
        classes = UserSecurityConfigIntegrationTest.TestApplication.class,
        properties = "eureka.client.enabled=false"
)
@AutoConfigureMockMvc
class UserSecurityConfigIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CustomOAuth2UserService customOAuth2UserService;

    @MockBean
    private OAuth2SuccessHandler oAuth2SuccessHandler;

    @MockBean
    private ClientRegistrationRepository clientRegistrationRepository;

    @MockBean
    private OAuth2AuthorizedClientRepository oAuth2AuthorizedClientRepository;

    @Test
    @DisplayName("security config permits auth endpoints without authentication")
    void authEndpoints_arePermitted() throws Exception {
        mockMvc.perform(get("/api/auth/ping"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("security config protects non auth endpoints")
    void protectedEndpoints_requireAuthentication() throws Exception {
        mockMvc.perform(get("/api/protected/ping"))
                .andExpect(status().is3xxRedirection());
    }

    @RestController
    static class TestController {
        @GetMapping("/api/auth/ping")
        String authPing() {
            return "ok";
        }

        @GetMapping("/api/protected/ping")
        String protectedPing() {
            return "protected";
        }
    }

    @SpringBootConfiguration
    @EnableAutoConfiguration(exclude = {
            DataSourceAutoConfiguration.class,
            HibernateJpaAutoConfiguration.class,
            JpaRepositoriesAutoConfiguration.class,
            FlywayAutoConfiguration.class
    })
    @Import({SecurityConfig.class, TestController.class})
    static class TestApplication {
    }
}

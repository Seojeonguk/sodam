package com.sodam.userservice.domain.model;

import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class OAuthAttributesTest {

    @Test
    @DisplayName("of maps google attributes")
    void of_mapsGoogleAttributes() {
        OAuthAttributes attributes = OAuthAttributes.of(
                "google",
                "sub",
                Map.of(
                        "name", "tester",
                        "email", "google@example.com",
                        "picture", "https://image"
                )
        );

        assertThat(attributes.getName()).isEqualTo("tester");
        assertThat(attributes.getEmail()).isEqualTo("google@example.com");
        assertThat(attributes.getPicture()).isEqualTo("https://image");
    }

    @Test
    @DisplayName("of maps kakao attributes")
    void of_mapsKakaoAttributes() {
        OAuthAttributes attributes = OAuthAttributes.of(
                "kakao",
                "id",
                Map.of(
                        "kakao_account", Map.of(
                                "email", "kakao@example.com",
                                "profile", Map.of(
                                        "nickname", "kakao-user",
                                        "profile_image_url", "https://kakao-image"
                                )
                        )
                )
        );

        assertThat(attributes.getName()).isEqualTo("kakao-user");
        assertThat(attributes.getEmail()).isEqualTo("kakao@example.com");
        assertThat(attributes.getPicture()).isEqualTo("https://kakao-image");
    }

    @Test
    @DisplayName("of throws when kakao account structure is missing")
    void of_throwsWhenKakaoAccountStructureMissing() {
        assertThatThrownBy(() -> OAuthAttributes.of("kakao", "id", Map.of()))
                .isInstanceOf(NullPointerException.class);
    }
}

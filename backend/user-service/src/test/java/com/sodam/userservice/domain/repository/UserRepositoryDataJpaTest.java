package com.sodam.userservice.domain.repository;

import com.sodam.userservice.domain.model.AuthProvider;
import com.sodam.userservice.domain.model.Role;
import com.sodam.userservice.domain.model.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(properties = {
        "spring.flyway.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.url=jdbc:h2:mem:userdb;MODE=MySQL;DB_CLOSE_DELAY=-1"
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class UserRepositoryDataJpaTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("findByEmail returns saved user")
    void findByEmail_returnsSavedUser() {
        userRepository.save(User.builder()
                .email("user@example.com")
                .name("tester")
                .password("encoded-password")
                .authProvider(AuthProvider.LOCAL)
                .role(Role.USER)
                .build());

        User found = userRepository.findByEmail("user@example.com").orElseThrow();

        assertThat(found.getName()).isEqualTo("tester");
        assertThat(found.getRole()).isEqualTo(Role.USER);
    }

    @Test
    @DisplayName("saved user exposes spring security authority")
    void savedUser_exposesAuthority() {
        User saved = userRepository.save(User.builder()
                .email("admin@example.com")
                .name("admin")
                .password("encoded-password")
                .authProvider(AuthProvider.LOCAL)
                .role(Role.USER)
                .build());

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getAuthorities())
                .extracting(Object::toString)
                .containsExactly("ROLE_USER");
    }
}

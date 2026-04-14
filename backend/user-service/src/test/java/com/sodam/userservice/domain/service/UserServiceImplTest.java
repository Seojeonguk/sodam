package com.sodam.userservice.domain.service;

import com.sodam.userservice.application.exception.UserNotFoundException;
import com.sodam.userservice.domain.model.Role;
import com.sodam.userservice.domain.model.User;
import com.sodam.userservice.domain.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserServiceImpl userService;

    @Test
    @DisplayName("register rejects duplicate email")
    void registerNewUser_throwsWhenEmailAlreadyExists() {
        User newUser = User.builder()
                .email("user@example.com")
                .password("password")
                .name("tester")
                .role(Role.USER)
                .build();

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(newUser));

        assertThatThrownBy(() -> userService.registerNewUser(newUser))
                .isInstanceOf(IllegalArgumentException.class);

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("findUserByEmail throws when user is missing")
    void findUserByEmail_throwsWhenMissing() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.findUserByEmail("missing@example.com"))
                .isInstanceOf(UserNotFoundException.class);
    }

    @Test
    @DisplayName("findUserById throws when user is missing")
    void findUserById_throwsWhenMissing() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.findUserById(99L))
                .isInstanceOf(UserNotFoundException.class);
    }

    @Test
    @DisplayName("updateUser applies mutable fields and saves")
    void updateUser_updatesFields() {
        User existingUser = User.builder()
                .id(1L)
                .email("before@example.com")
                .name("before")
                .password("password")
                .role(Role.USER)
                .build();

        User updateRequest = User.builder()
                .id(1L)
                .email("after@example.com")
                .name("after")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(existingUser));
        when(userRepository.save(existingUser)).thenReturn(existingUser);

        User updatedUser = userService.updateUser(updateRequest);

        assertThat(updatedUser.getEmail()).isEqualTo("after@example.com");
        assertThat(updatedUser.getName()).isEqualTo("after");
    }

    @Test
    @DisplayName("updateUser throws when target user is missing")
    void updateUser_throwsWhenMissing() {
        User updateRequest = User.builder()
                .id(1L)
                .email("after@example.com")
                .name("after")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.updateUser(updateRequest))
                .isInstanceOf(UserNotFoundException.class);
    }

    @Test
    @DisplayName("deleteUser throws when target user is missing")
    void deleteUser_throwsWhenMissing() {
        when(userRepository.existsById(11L)).thenReturn(false);

        assertThatThrownBy(() -> userService.deleteUser(11L))
                .isInstanceOf(UserNotFoundException.class);
    }
}

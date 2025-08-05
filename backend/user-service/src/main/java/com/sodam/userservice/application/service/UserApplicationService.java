package com.sodam.userservice.application.service;

import com.sodam.userservice.common.exception.UserNotFoundException;
import com.sodam.userservice.domain.model.User;
import com.sodam.userservice.domain.service.UserServiceImpl;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserApplicationService {
    private final UserServiceImpl userService;

    @Transactional
    public User registerNewUser(User newUser) {
        return userService.registerNewUser(newUser);
    }

    @Transactional
    public User findUserByEmail(String email) {
        return userService.findUserByEmail(email);
    }

    @Transactional
    public User findUserById(Long userId) {
        return userService.findUserById(userId);
    }

    @Transactional
    public User updateUser(User user) {
        return userService.updateUser(user);
    }

    @Transactional
    public void deleteUser(Long userId) {
        userService.deleteUser(userId);
    }
}

package com.sodam.userservice.domain.service;

import com.sodam.userservice.application.exception.UserNotFoundException;
import com.sodam.userservice.domain.model.User;
import com.sodam.userservice.domain.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public User registerNewUser(User newUser) {
        // 이미 이메일이 존재하는지 확인하는 로직 추가
        if (userRepository.findByEmail(newUser.getEmail()).isPresent()) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다: " + newUser.getEmail());
        }
        return userRepository.save(newUser);
    }

    @Override
    public User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("해당 이메일의 사용자를 찾을 수 없습니다: " + email));
    }

    @Override
    public User findUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("해당 ID의 사용자를 찾을 수 없습니다: " + userId));
    }

    @Override
    @Transactional
    public User updateUser(User user) {
        // 사용자 존재 여부 확인 로직
        User existingUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new UserNotFoundException("업데이트할 사용자를 찾을 수 없습니다: " + user.getId()));

        // 기존 사용자 정보에 새로운 정보 반영
        existingUser.setName(user.getName());
        existingUser.setEmail(user.getEmail());

        // 비밀번호는 별도 메서드로 업데이트하는 것이 안전
        // existingUser.setPassword(user.getPassword());

        return userRepository.save(existingUser);
    }

    @Override
    public List<User> findUsersByIds(List<Long> ids) {
        return userRepository.findAllByIdIn(ids);
    }

    @Override
    @Transactional
    public void deleteUser(Long userId) {
        // 사용자 존재 여부 확인 후 삭제
        if (!userRepository.existsById(userId)) {
            throw new UserNotFoundException("삭제할 사용자를 찾을 수 없습니다: " + userId);
        }
        userRepository.deleteById(userId);
    }
}

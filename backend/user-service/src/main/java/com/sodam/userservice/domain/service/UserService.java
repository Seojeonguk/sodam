package com.sodam.userservice.domain.service;

import com.sodam.userservice.domain.model.User;
import java.util.List;

public interface UserService {
    /**
     * 새로운 사용자를 등록합니다.
     * @param newUser 등록할 사용자 엔티티
     * @return 등록된 사용자 엔티티
     */
    User registerNewUser(User newUser);

    /**
     * 이메일로 사용자 정보를 조회합니다.
     * @param email 조회할 사용자의 이메일
     * @return 조회된 사용자 엔티티
     */
    User findUserByEmail(String email);

    /**
     * ID로 사용자 정보를 조회합니다.
     * @param userId 조회할 사용자의 ID
     * @return 조회된 사용자 엔티티
     */
    User findUserById(Long userId);

    /**
     * 사용자 정보를 업데이트합니다.
     * @param user 업데이트할 사용자 엔티티
     * @return 업데이트된 사용자 엔티티
     */
    User updateUser(User user);

    /**
     * 사용자를 삭제합니다.
     * @param userId 삭제할 사용자의 ID
     */
    void deleteUser(Long userId);

    List<User> findUsersByIds(List<Long> ids);
}

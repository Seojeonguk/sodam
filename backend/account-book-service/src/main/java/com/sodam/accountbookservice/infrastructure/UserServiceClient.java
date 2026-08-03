package com.sodam.accountbookservice.infrastructure;


import com.sodam.common.response.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

@FeignClient(name = "user-service")
public interface UserServiceClient {

    @GetMapping("/internal/users/{email}")
    ApiResponse<UserDto> getUser(@PathVariable("email") String email);

    /** userId 목록으로 유저 정보 일괄 조회 */
    @PostMapping("/internal/users/batch")
    ApiResponse<List<UserDto>> getUsersByIds(@RequestBody List<Long> userIds);
}

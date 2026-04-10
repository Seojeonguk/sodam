package com.example.categoryservice.infrastructure;

import com.sodam.common.response.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "user-service")
public interface UserServiceClient {

    @GetMapping("/internal/users/{email}")
    ApiResponse<UserDto> getUser(@PathVariable("email") String email);
}

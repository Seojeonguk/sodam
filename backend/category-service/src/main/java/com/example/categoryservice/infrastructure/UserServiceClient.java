package com.example.categoryservice.infrastructure;

import com.example.categoryservice.config.FeignConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "user-service", configuration = FeignConfig.class)
public interface UserServiceClient {

    @GetMapping("/api/auth/users/{email}")
    ApiResponse<UserDto> getUser(@PathVariable("email") String email);
}

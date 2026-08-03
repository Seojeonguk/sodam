package com.sodam.common.security;

public record UserContext(String email) {
    public static UserContext of(String email) {
        return new UserContext(email);
    }
}

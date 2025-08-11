package com.sodam.userservice.application.api.dto;

import lombok.Data;

@Data
public class KakaoOauthToken {
    private String token_type;
    private String access_token;
    private Long expires_in;
    private String refresh_token;
    private Long refresh_token_expires_in;
    private String scope;
}

package com.sodam.userservice.application.api.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class KakaoProfile {
    private Long id;
    private String connectedAt;
    private Properties properties;
    private KakaoAccount kakaoAccount;

    @Getter
    @Setter
    @ToString
    public static class Properties {
        private String nickname;
        private String profileImage;
        private String thumbnailImage;
    }

    @Getter
    @Setter
    @ToString
    public static class KakaoAccount {
        private Boolean profileNicknameNeedsAgreement;
        private Boolean profileImageNeedsAgreement;
        private Profile profile;
        private Boolean hasEmail;
        private Boolean emailNeedsAgreement;
        private Boolean isEmailValid;
        private Boolean isEmailVerified;
        private String email;
        // 추가 정보가 필요하다면 여기에 필드를 추가하면 됩니다.
    }

    @Getter
    @Setter
    @ToString
    public static class Profile {
        private String nickname;
        private String thumbnailImageUrl;
        private String profileImageUrl;
        private Boolean isDefaultImage;
    }
}
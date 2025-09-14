package com.sodam.accountbookservice.infrastructure;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@ToString
@Setter
@Getter
public class UserDto {
    private Long id;
    private String email;
    private String name;
    private String imageUrl;
}

package com.sodam.accountbookservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@EnableJpaAuditing
@SpringBootApplication
@EnableFeignClients(basePackages = {"com.sodam.accountbookservice.infrastructure"})
public class AccountBookServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AccountBookServiceApplication.class, args);
    }

}

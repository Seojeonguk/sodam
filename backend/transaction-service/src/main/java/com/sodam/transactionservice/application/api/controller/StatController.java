package com.sodam.transactionservice.application.api.controller;

import com.sodam.transactionservice.application.api.dto.StatRequest;
import com.sodam.transactionservice.application.api.dto.StatResponse;
import com.sodam.transactionservice.application.service.StatApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/stat")
public class StatController {
    private final StatApplicationService service;

    @GetMapping("")
    public ResponseEntity<StatResponse> getStat(@ModelAttribute StatRequest request, @RequestHeader("X-User-Email") String email) {
        return ResponseEntity.ok(service.getStat(request, email));
    }
}

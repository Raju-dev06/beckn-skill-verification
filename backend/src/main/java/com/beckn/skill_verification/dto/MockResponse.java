package com.beckn.skill_verification.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class MockResponse {
    private String status;
    private Integer score;
}

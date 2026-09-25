package com.beckn.skill_verification.controller;

import com.beckn.skill_verification.dto.CandidateProfileDto;
import com.beckn.skill_verification.service.EmployerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/employer")
@RequiredArgsConstructor
public class EmployerController {
    
    private final EmployerService employerService;
    
    @GetMapping("/candidates/search")
    public ResponseEntity<List<CandidateProfileDto>> searchCandidates(@RequestParam String name) {
        return ResponseEntity.ok(employerService.searchCandidatesByName(name));
    }
}

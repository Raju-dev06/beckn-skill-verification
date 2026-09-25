package com.beckn.skill_verification.service;

import com.beckn.skill_verification.dto.CandidateProfileDto;
import com.beckn.skill_verification.entity.User;
import com.beckn.skill_verification.repository.UserRepository;
import com.beckn.skill_verification.service.CandidateService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmployerService {

    private final UserRepository userRepository;
    private final CandidateService candidateService;

    public List<CandidateProfileDto> searchCandidatesByName(String name) {
        List<User> users = userRepository.findByNameContainingIgnoreCaseAndRole(name, "CANDIDATE");
        return users.stream()
                .map(u -> candidateService.getCandidateProfile(u.getId()))
                .collect(Collectors.toList());
    }
}

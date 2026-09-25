package com.beckn.skill_verification.service;

import com.beckn.skill_verification.dto.AuthRequest;
import com.beckn.skill_verification.dto.AuthResponse;
import com.beckn.skill_verification.entity.User;
import com.beckn.skill_verification.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

import com.beckn.skill_verification.entity.CandidateProfile;
import com.beckn.skill_verification.repository.CandidateProfileRepository;
import com.beckn.skill_verification.entity.CandidateSkill;
import com.beckn.skill_verification.repository.CandidateSkillRepository;
import com.beckn.skill_verification.entity.Skill;
import com.beckn.skill_verification.repository.SkillRepository;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtTokenProvider tokenProvider;
    private final CandidateProfileRepository profileRepository;
    private final CandidateSkillRepository candidateSkillRepository;
    private final SkillRepository skillRepository;

    public AuthResponse login(AuthRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getPassword().equals(request.getPassword())) {
                String token = tokenProvider.generateToken(user);
                AuthResponse response = new AuthResponse();
                response.setToken(token);
                response.setUser(user);
                return response;
            }
        }
        throw new RuntimeException("Invalid credentials");
    }

    public AuthResponse register(com.beckn.skill_verification.dto.SignupRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }
        
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword());
        user.setRole(request.getRole());
        user = userRepository.save(user);

        if ("CANDIDATE".equals(user.getRole())) {
            CandidateProfile profile = new CandidateProfile();
            profile.setUserId(user.getId());
            profile.setEducation(request.getEducation() != null ? request.getEducation() : "");
            profile.setCollege(request.getCollege() != null ? request.getCollege() : "");
            profile.setGraduationYear(request.getGraduationYear() != null ? request.getGraduationYear() : 0);
            profile.setPhone(request.getPhone() != null ? request.getPhone() : "");
            profileRepository.save(profile);
            
            // Assign all available skills so the dashboard looks full and realistic (like the demo accounts)
            java.util.List<Skill> allSkills = skillRepository.findAll();
            for (Skill skill : allSkills) {
                CandidateSkill cs = new CandidateSkill();
                cs.setCandidateId(user.getId());
                cs.setSkillId(skill.getId());
                cs.setVerificationStatus("UNVERIFIED");
                candidateSkillRepository.save(cs);
            }
        }

        String token = tokenProvider.generateToken(user);
        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setUser(user);
        return response;
    }

    public long getUserCount() {
        return userRepository.count();
    }

    public long getSkillCount() {
        return skillRepository.count();
    }
}

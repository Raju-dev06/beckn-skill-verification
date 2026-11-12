package com.beckn.skill_verification.service;

import com.beckn.skill_verification.dto.CandidateCertificateDto;
import com.beckn.skill_verification.dto.CandidateProfileDto;
import com.beckn.skill_verification.dto.CandidateSkillDto;
import com.beckn.skill_verification.entity.User;
import com.beckn.skill_verification.repository.UserRepository;
import com.beckn.skill_verification.entity.CandidateProfile;
import com.beckn.skill_verification.repository.CandidateProfileRepository;
import com.beckn.skill_verification.entity.CandidateSkill;
import com.beckn.skill_verification.repository.CandidateSkillRepository;
import com.beckn.skill_verification.entity.Skill;
import com.beckn.skill_verification.repository.SkillRepository;
import com.beckn.skill_verification.entity.Credential;
import com.beckn.skill_verification.repository.CredentialRepository;
import com.beckn.skill_verification.entity.VerificationRecord;
import com.beckn.skill_verification.repository.VerificationRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CandidateService {

    private final UserRepository userRepository;
    private final CandidateProfileRepository profileRepository;
    private final CandidateSkillRepository candidateSkillRepository;
    private final SkillRepository skillRepository;
    private final CredentialRepository credentialRepository;
    private final VerificationRecordRepository verificationRecordRepository;

    public CandidateProfileDto getCandidateProfile(Long candidateId) {
        User user = userRepository.findById(candidateId).orElseThrow(() -> new RuntimeException("User not found"));
        CandidateProfile profile = profileRepository.findByUserId(candidateId).orElse(new CandidateProfile());
        
        CandidateProfileDto dto = new CandidateProfileDto();
        dto.setCandidateId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setPhone(profile.getPhone());
        dto.setEducation(profile.getEducation());
        dto.setCollege(profile.getCollege());
        dto.setGraduationYear(profile.getGraduationYear());
        
        List<CandidateSkill> skills = candidateSkillRepository.findByCandidateId(candidateId);
        List<CandidateSkillDto> skillDtos = skills.stream().map(cs -> {
            Skill s = skillRepository.findById(cs.getSkillId()).orElseThrow();
            CandidateSkillDto sdto = new CandidateSkillDto();
            sdto.setSkillId(s.getId());
            sdto.setName(s.getName());
            sdto.setCategory(s.getCategory());
            sdto.setCompetencyLevel(cs.getCompetencyLevel());
            sdto.setVerificationStatus(cs.getVerificationStatus());
            sdto.setConfidenceScore(cs.getConfidenceScore());
            return sdto;
        }).collect(Collectors.toList());
        
        dto.setSkills(skillDtos);

        // Fetch and map all candidate credentials / certificates
        List<Credential> credentials = credentialRepository.findByCandidateIdOrderByIdDesc(candidateId);
        List<CandidateCertificateDto> certDtos = new ArrayList<>();
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm");

        for (Credential cred : credentials) {
            CandidateCertificateDto cdto = new CandidateCertificateDto();
            cdto.setId(cred.getId());
            cdto.setCandidateId(cred.getCandidateId());
            cdto.setSkillId(cred.getSkillId());
            cdto.setCertificateName(cred.getCertificateName() != null ? cred.getCertificateName() : "Verified Certificate");
            cdto.setCredentialId(cred.getCredentialId() != null ? cred.getCredentialId() : "CERT-" + cred.getId());
            cdto.setIssuer(cred.getIssuer() != null ? cred.getIssuer() : "Accredited Authority");
            cdto.setFilePath(cred.getFilePath());
            if (cred.getFilePath() != null && !cred.getFilePath().isBlank()) {
                cdto.setFileUrl("http://localhost:8081/" + cred.getFilePath().replace("\\", "/"));
            }

            // Map skill information
            if (cred.getSkillId() != null) {
                Skill s = skillRepository.findById(cred.getSkillId()).orElse(null);
                if (s != null) {
                    cdto.setSkillName(s.getName());
                    cdto.setSkillCategory(s.getCategory());
                }
            }
            if (cdto.getSkillName() == null) {
                cdto.setSkillName("Professional Credential");
                cdto.setSkillCategory("Certification");
            }

            // Look up verification record
            VerificationRecord vr = (cred.getSkillId() != null)
                    ? verificationRecordRepository.findByCandidateIdAndSkillId(candidateId, cred.getSkillId())
                    : null;

            boolean isVerified = "VERIFIED".equalsIgnoreCase(cred.getStatus())
                    || (vr != null && ("VERIFIED".equalsIgnoreCase(vr.getFinalStatus()) || "VERIFIED".equalsIgnoreCase(vr.getCredentialStatus())));

            boolean isRejected = "NOT VERIFIED".equalsIgnoreCase(cred.getStatus())
                    || (vr != null && ("NOT VERIFIED".equalsIgnoreCase(vr.getFinalStatus()) || "REJECTED".equalsIgnoreCase(vr.getCredentialStatus())));

            if (isVerified) {
                cdto.setStatus("VERIFIED");
                cdto.setValidity("VALID / AUTHENTIC");
                cdto.setValid(true);
                cdto.setConfidenceScore(vr != null && vr.getConfidenceScore() != null && vr.getConfidenceScore() > 0 
                        ? Math.min(vr.getConfidenceScore(), 95) : 95);
                cdto.setCompetencyLevel(vr != null && vr.getCompetencyLevel() != null && !"UNKNOWN".equalsIgnoreCase(vr.getCompetencyLevel()) 
                        ? vr.getCompetencyLevel() : "Advanced");
                if (vr != null && vr.getVerifiedAt() != null) {
                    cdto.setVerifiedAt(vr.getVerifiedAt());
                    cdto.setFormattedDate(vr.getVerifiedAt().format(dtf));
                } else {
                    cdto.setVerifiedAt(LocalDateTime.now());
                    cdto.setFormattedDate(LocalDateTime.now().format(dtf));
                }
            } else if (isRejected) {
                cdto.setStatus("NOT VERIFIED");
                cdto.setValidity("REVOKED / UNVERIFIED");
                cdto.setValid(false);
                cdto.setConfidenceScore(vr != null && vr.getConfidenceScore() != null ? vr.getConfidenceScore() : 15);
                cdto.setCompetencyLevel("Unverified");
                if (vr != null && vr.getVerifiedAt() != null) {
                    cdto.setVerifiedAt(vr.getVerifiedAt());
                    cdto.setFormattedDate(vr.getVerifiedAt().format(dtf));
                }
            } else {
                cdto.setStatus(cred.getStatus() != null ? cred.getStatus() : "UPLOADED");
                cdto.setValidity("PENDING AUDIT");
                cdto.setValid(false);
                cdto.setConfidenceScore(0);
                cdto.setCompetencyLevel("Pending Audit");
            }

            String identifier = cdto.getCredentialId();
            cdto.setVerificationProofUrn("urn:onest:credential:" + identifier);
            certDtos.add(cdto);
        }
        
        dto.setCertificates(certDtos);
        
        // Calculate overall score based on verified skills & certificates
        int totalScore = 0;
        int verifiedCount = 0;
        for (CandidateSkillDto sdto : skillDtos) {
            if ("VERIFIED".equals(sdto.getVerificationStatus()) && sdto.getConfidenceScore() != null) {
                totalScore += sdto.getConfidenceScore();
                verifiedCount++;
            }
        }
        for (CandidateCertificateDto cdto : certDtos) {
            if (cdto.isValid() && cdto.getConfidenceScore() != null && cdto.getConfidenceScore() > 0) {
                boolean alreadyCounted = skillDtos.stream().anyMatch(s -> s.getSkillId() != null 
                        && s.getSkillId().equals(cdto.getSkillId()) && "VERIFIED".equals(s.getVerificationStatus()));
                if (!alreadyCounted) {
                    totalScore += cdto.getConfidenceScore();
                    verifiedCount++;
                }
            }
        }
        dto.setOverallVerificationScore(verifiedCount > 0 ? Math.min(totalScore / verifiedCount, 95) : 0);
        
        return dto;
    }
}

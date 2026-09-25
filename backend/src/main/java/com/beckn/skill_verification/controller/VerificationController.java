package com.beckn.skill_verification.controller;

import com.beckn.skill_verification.dto.VerificationResultDto;
import com.beckn.skill_verification.entity.Consent;
import com.beckn.skill_verification.repository.ConsentRepository;
import com.beckn.skill_verification.entity.VerificationRecord;
import com.beckn.skill_verification.repository.VerificationRecordRepository;
import com.beckn.skill_verification.entity.Skill;
import com.beckn.skill_verification.repository.SkillRepository;
import com.beckn.skill_verification.entity.Credential;
import com.beckn.skill_verification.repository.CredentialRepository;
import com.beckn.skill_verification.service.VerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/verification")
@RequiredArgsConstructor
public class VerificationController {
    
    private final VerificationService verificationService;
    private final ConsentRepository consentRepository;
    private final VerificationRecordRepository recordRepository;
    private final SkillRepository skillRepository;
    private final CredentialRepository credentialRepository;
    
    @PostMapping("/{candidateId}/{skillId}/consent")
    public ResponseEntity<?> giveConsent(@PathVariable Long candidateId, @PathVariable Long skillId, @RequestBody Map<String, Boolean> body) {
        Consent consent = consentRepository.findByCandidateIdAndSkillId(candidateId, skillId).orElse(new Consent());
        consent.setCandidateId(candidateId);
        consent.setSkillId(skillId);
        consent.setConsentGiven(body.getOrDefault("consent", false));
        consent.setConsentTimestamp(LocalDateTime.now());
        consentRepository.save(consent);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/{candidateId}/{skillId}/consent")
    public ResponseEntity<Consent> getConsent(@PathVariable Long candidateId, @PathVariable Long skillId) {
        return ResponseEntity.ok(consentRepository.findByCandidateIdAndSkillId(candidateId, skillId).orElse(new Consent()));
    }
    
    @PostMapping("/{candidateId}/{skillId}")
    public ResponseEntity<VerificationRecord> verifySkill(@PathVariable Long candidateId, @PathVariable Long skillId) {
        try {
            VerificationRecord record = verificationService.verifySkill(candidateId, skillId);
            return ResponseEntity.ok(record);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/{candidateId}/{skillId}/result")
    public ResponseEntity<VerificationResultDto> getVerificationResult(@PathVariable Long candidateId, @PathVariable Long skillId) {
        VerificationRecord record = recordRepository.findByCandidateIdAndSkillId(candidateId, skillId);
        if (record == null) return ResponseEntity.notFound().build();
        
        Skill skill = skillRepository.findById(skillId).orElseThrow();
        Credential credential = credentialRepository.findByCandidateIdAndSkillId(candidateId, skillId).orElse(null);
        
        VerificationResultDto dto = new VerificationResultDto();
        dto.setSkillName(skill.getName());
        dto.setCategory(skill.getCategory());
        dto.setCompetencyLevel(record.getCompetencyLevel());
        dto.setConfidenceScore(record.getConfidenceScore());
        dto.setStatus(record.getFinalStatus());
        dto.setVerifiedAt(record.getVerifiedAt());
        
        dto.setCredentialStatus(record.getCredentialStatus());
        dto.setEducationStatus(record.getEducationStatus());
        dto.setAssessmentStatus(record.getAssessmentStatus());
        
        if (credential != null) {
            dto.setCertificateName(credential.getCertificateName());
            dto.setCredentialId(credential.getCredentialId());
            dto.setIssuer(credential.getIssuer());
        }
        
        return ResponseEntity.ok(dto);
    }
}

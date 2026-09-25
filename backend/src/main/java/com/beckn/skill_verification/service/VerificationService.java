package com.beckn.skill_verification.service;
import com.beckn.skill_verification.controller.BecknController;


import com.beckn.skill_verification.service.BecknClient;
import com.beckn.skill_verification.entity.BecknTransaction;
import com.beckn.skill_verification.repository.BecknTransactionRepository;
import com.beckn.skill_verification.entity.Consent;
import com.beckn.skill_verification.repository.ConsentRepository;
import com.beckn.skill_verification.entity.VerificationRecord;
import com.beckn.skill_verification.repository.VerificationRecordRepository;
import com.beckn.skill_verification.entity.VerificationHistory;
import com.beckn.skill_verification.repository.VerificationHistoryRepository;
import com.beckn.skill_verification.entity.Credential;
import com.beckn.skill_verification.repository.CredentialRepository;
import com.beckn.skill_verification.entity.CandidateSkill;
import com.beckn.skill_verification.repository.CandidateSkillRepository;
import com.beckn.skill_verification.entity.Skill;
import com.beckn.skill_verification.repository.SkillRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class VerificationService {

    private final CredentialRepository credentialRepository;
    private final CandidateSkillRepository candidateSkillRepository;
    private final ConsentRepository consentRepository;
    private final VerificationRecordRepository verificationRecordRepository;
    private final VerificationHistoryRepository verificationHistoryRepository;
    private final SkillRepository skillRepository;
    private final BecknTransactionRepository becknTransactionRepository;

    private final BecknClient mockBecknClient;
    private final BecknClient realBecknClient;

    @Value("${app.integration.mode:MOCK}")
    private String integrationMode;

    public VerificationRecord verifySkill(Long candidateId, Long skillId) {
        // 1. Consent Validation
        Consent consent = consentRepository.findByCandidateIdAndSkillId(candidateId, skillId)
                .orElseThrow(() -> new RuntimeException("Consent not given for verification"));
        if (!consent.getConsentGiven()) {
            throw new RuntimeException("Consent not given for verification");
        }

        // 2. Credential Validation
        Credential credential = credentialRepository.findByCandidateIdAndSkillId(candidateId, skillId)
                .orElseThrow(() -> new RuntimeException("No credential uploaded for this skill"));
        
        Skill skill = skillRepository.findById(skillId).orElseThrow();

        // 3. Initialize Verification Record
        VerificationRecord record = verificationRecordRepository.findByCandidateIdAndSkillId(candidateId, skillId);
        if (record == null) {
            record = new VerificationRecord();
            record.setCandidateId(candidateId);
            record.setSkillId(skillId);
        }
        
        // Initial State Transition
        record.setFinalStatus("REQUESTED");
        record.setCredentialStatus("DISCOVERING");
        record.setEducationStatus("PENDING");
        record.setAssessmentStatus("PENDING");
        record.setConfidenceScore(0);
        record.setCompetencyLevel("UNKNOWN");
        record = verificationRecordRepository.save(record);
        
        updateCandidateSkillStatus(candidateId, skillId, "REQUESTED", 0, "UNKNOWN");

        // 4. Create Beckn Transaction
        String txId = UUID.randomUUID().toString();
        BecknTransaction tx = new BecknTransaction();
        tx.setTransactionId(txId);
        tx.setMessageId(UUID.randomUUID().toString());
        tx.setAction("search");
        tx.setSender("SKILL_VERIFICATION_BAP");
        tx.setReceiver("ONEST_BGN");
        tx.setStatus("SENT");
        tx.setRequestPayload(String.format("{\"candidateId\": %d, \"skillId\": %d, \"credentialId\": \"%s\"}", candidateId, skillId, credential.getCredentialId()));
        becknTransactionRepository.save(tx);
        
        // Save initial history
        VerificationHistory history = new VerificationHistory();
        history.setCandidateId(candidateId);
        history.setSkillId(skillId);
        history.setTransactionId(txId);
        history.setStatus("REQUESTED");
        history.setProvider(integrationMode);
        verificationHistoryRepository.save(history);

        // 5. Route to correct client
        BecknClient client = "REAL".equalsIgnoreCase(integrationMode) ? realBecknClient : mockBecknClient;
        client.search(candidateId.toString(), skill.getName(), txId);

        return record;
    }

    // Callbacks from BecknController
    public void processOnSearch(String transactionId, String providerId) {
        BecknTransaction tx = becknTransactionRepository.findByTransactionIdAndAction(transactionId, "search").orElseThrow();
        tx.setStatus("ACK");
        becknTransactionRepository.save(tx);
        
        VerificationHistory history = verificationHistoryRepository.findAll().stream().filter(h -> transactionId.equals(h.getTransactionId())).findFirst().orElseThrow();
        history.setStatus("DISCOVERING");
        verificationHistoryRepository.save(history);
        
        VerificationRecord record = verificationRecordRepository.findByCandidateIdAndSkillId(history.getCandidateId(), history.getSkillId());
        record.setFinalStatus("DISCOVERING");
        record.setCredentialStatus("PROVIDER_SELECTED");
        verificationRecordRepository.save(record);
        
        updateCandidateSkillStatus(history.getCandidateId(), history.getSkillId(), "DISCOVERING", 0, "UNKNOWN");
        
        BecknClient client = "REAL".equalsIgnoreCase(integrationMode) ? realBecknClient : mockBecknClient;
        client.init(transactionId, providerId, "CRED-XXX");
    }

    public void processOnInit(String transactionId) {
        BecknTransaction tx = becknTransactionRepository.findByTransactionIdAndAction(transactionId, "search").orElseThrow();
        
        VerificationHistory history = verificationHistoryRepository.findAll().stream().filter(h -> transactionId.equals(h.getTransactionId())).findFirst().orElseThrow();
        history.setStatus("INITIALIZED");
        verificationHistoryRepository.save(history);
        
        VerificationRecord record = verificationRecordRepository.findByCandidateIdAndSkillId(history.getCandidateId(), history.getSkillId());
        record.setFinalStatus("INITIALIZED");
        record.setCredentialStatus("IN_PROGRESS");
        verificationRecordRepository.save(record);
        
        updateCandidateSkillStatus(history.getCandidateId(), history.getSkillId(), "INITIALIZED", 0, "UNKNOWN");
        
        BecknClient client = "REAL".equalsIgnoreCase(integrationMode) ? realBecknClient : mockBecknClient;
        client.confirm(transactionId, "provider-123", "CRED-XXX");
    }

    public void processOnConfirm(String transactionId, String verificationStatus, int score) {
        VerificationHistory history = verificationHistoryRepository.findAll().stream().filter(h -> transactionId.equals(h.getTransactionId())).findFirst().orElseThrow();
        
        int educationScore = 20; // Simulated auxiliary score
        int totalScore = Math.min(score + educationScore, 100);
        
        String competency = "Beginner";
        if (totalScore >= 90) competency = "Advanced";
        else if (totalScore >= 70) competency = "Intermediate";

        String finalStatus = totalScore >= 90 ? "VERIFIED" : (totalScore >= 70 ? "PARTIALLY VERIFIED" : "NOT VERIFIED");
        
        history.setStatus(finalStatus);
        history.setConfidence(totalScore);
        history.setCompetencyLevel(competency);
        history.setCompletedAt(LocalDateTime.now());
        verificationHistoryRepository.save(history);
        
        VerificationRecord record = verificationRecordRepository.findByCandidateIdAndSkillId(history.getCandidateId(), history.getSkillId());
        record.setFinalStatus(finalStatus);
        record.setCredentialStatus("VERIFIED");
        record.setEducationStatus("VERIFIED");
        record.setAssessmentStatus("VERIFIED");
        record.setConfidenceScore(totalScore);
        record.setCompetencyLevel(competency);
        record.setVerifiedAt(LocalDateTime.now());
        verificationRecordRepository.save(record);
        
        updateCandidateSkillStatus(history.getCandidateId(), history.getSkillId(), finalStatus, totalScore, competency);
        
        Credential credential = credentialRepository.findByCandidateIdAndSkillId(history.getCandidateId(), history.getSkillId()).orElseThrow();
        credential.setStatus(finalStatus);
        credentialRepository.save(credential);
    }
    
    private void updateCandidateSkillStatus(Long candidateId, Long skillId, String status, int score, String competency) {
        CandidateSkill cs = candidateSkillRepository.findByCandidateIdAndSkillId(candidateId, skillId).orElseThrow();
        cs.setVerificationStatus(status);
        cs.setConfidenceScore(score);
        cs.setCompetencyLevel(competency);
        candidateSkillRepository.save(cs);
    }
}

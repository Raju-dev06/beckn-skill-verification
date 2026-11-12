package com.beckn.skill_verification.controller;

import com.beckn.skill_verification.dto.CandidateProfileDto;
import com.beckn.skill_verification.entity.CandidateSkill;
import com.beckn.skill_verification.entity.Consent;
import com.beckn.skill_verification.entity.Credential;
import com.beckn.skill_verification.entity.Skill;
import com.beckn.skill_verification.entity.VerificationRecord;
import com.beckn.skill_verification.repository.CandidateSkillRepository;
import com.beckn.skill_verification.repository.ConsentRepository;
import com.beckn.skill_verification.repository.CredentialRepository;
import com.beckn.skill_verification.repository.SkillRepository;
import com.beckn.skill_verification.repository.VerificationRecordRepository;
import com.beckn.skill_verification.service.CandidateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/candidates")
@RequiredArgsConstructor
public class CandidateController {
    
    private final CandidateService candidateService;
    private final CredentialRepository credentialRepository;
    private final CandidateSkillRepository candidateSkillRepository;
    private final VerificationRecordRepository verificationRecordRepository;
    private final ConsentRepository consentRepository;
    private final SkillRepository skillRepository;
    private final com.beckn.skill_verification.service.ResumeVerificationService resumeVerificationService;
    private final com.beckn.skill_verification.service.QrCertificateVerificationService qrCertificateVerificationService;
    
    @GetMapping("/{id}")
    public ResponseEntity<CandidateProfileDto> getProfile(@PathVariable Long id) {
        return ResponseEntity.ok(candidateService.getCandidateProfile(id));
    }
    
    @PostMapping("/{id}/credentials")
    public ResponseEntity<Credential> addCredential(
            @PathVariable Long id,
            @RequestParam(value = "skillId", required = false) Long skillId,
            @RequestParam("certificateName") String certificateName,
            @RequestParam("credentialId") String credentialId,
            @RequestParam("issuer") String issuer,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "file", required = false) MultipartFile file) throws IOException {
        
        Credential credential = null;
        
        // 1. Look up by credential ID first to prevent duplicate re-uploads of same certificate
        if (credentialId != null && !credentialId.isBlank()) {
            credential = credentialRepository.findByCandidateIdAndCredentialId(id, credentialId).orElse(null);
        }
        
        // 2. If not found and skillId is specified, check by candidateId and skillId
        if (credential == null && skillId != null) {
            credential = credentialRepository.findByCandidateIdAndSkillId(id, skillId).orElse(null);
        }
        
        // 3. Otherwise create a new credential entry so multiple certificates are preserved
        if (credential == null) {
            credential = new Credential();
        }
        
        // Fallback / auto-match skillId if not provided
        if (skillId == null || skillId <= 0) {
            List<CandidateSkill> candidateSkills = candidateSkillRepository.findByCandidateId(id);
            if (!candidateSkills.isEmpty()) {
                // Try matching by certificate name keyword
                Long matchedSkillId = null;
                for (CandidateSkill cs : candidateSkills) {
                    Skill s = skillRepository.findById(cs.getSkillId()).orElse(null);
                    if (s != null && certificateName != null && certificateName.toLowerCase().contains(s.getName().toLowerCase())) {
                        matchedSkillId = s.getId();
                        break;
                    }
                }
                skillId = (matchedSkillId != null) ? matchedSkillId : candidateSkills.get(0).getSkillId();
            } else {
                skillId = 1L;
            }
        }
        
        credential.setCandidateId(id);
        credential.setSkillId(skillId);
        credential.setCertificateName(certificateName);
        credential.setCredentialId(credentialId);
        credential.setIssuer(issuer);
        
        String finalStatus = (status != null && !status.isBlank()) ? status : "UPLOADED";
        credential.setStatus(finalStatus);
        
        if (file != null && !file.isEmpty()) {
            String rawFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "credential.pdf";
            String cleanFilename = Paths.get(rawFilename).getFileName().toString().replaceAll("[^a-zA-Z0-9._-]", "_");
            String ext = cleanFilename.contains(".") ? cleanFilename.substring(cleanFilename.lastIndexOf(".")).toLowerCase() : "";
            
            // Strict extension whitelisting for security (prevent arbitrary file execution)
            if (!java.util.List.of(".pdf", ".png", ".jpg", ".jpeg", ".webp").contains(ext)) {
                return ResponseEntity.badRequest().build();
            }

            Path uploadDir = Paths.get("uploads").toAbsolutePath().normalize();
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }

            // Path traversal protection (CWE-22) and unique file naming
            String safeFileName = java.util.UUID.randomUUID().toString() + "_" + cleanFilename;
            Path targetPath = uploadDir.resolve(safeFileName).normalize();
            if (!targetPath.startsWith(uploadDir)) {
                throw new SecurityException("Directory traversal attempt blocked");
            }

            Files.write(targetPath, file.getBytes());
            credential.setFilePath("uploads/" + safeFileName);
        }
        
        Credential savedCred = credentialRepository.save(credential);
        
        // If certificate is verified (e.g. from Credly badge, QR scan, or verified resume link),
        // synchronize consent and verification record immediately to ensure authentic status across network
        if ("VERIFIED".equalsIgnoreCase(finalStatus)) {
            // Record consent
            Consent consent = consentRepository.findByCandidateIdAndSkillId(id, skillId)
                    .orElse(new Consent());
            consent.setCandidateId(id);
            consent.setSkillId(skillId);
            consent.setConsentGiven(true);
            consentRepository.save(consent);
            
            // Create or update Verification Record
            VerificationRecord vr = verificationRecordRepository.findByCandidateIdAndSkillId(id, skillId);
            if (vr == null) {
                vr = new VerificationRecord();
                vr.setCandidateId(id);
                vr.setSkillId(skillId);
            }
            vr.setFinalStatus("VERIFIED");
            vr.setCredentialStatus("VERIFIED");
            vr.setEducationStatus("VERIFIED");
            vr.setAssessmentStatus("VERIFIED");
            vr.setConfidenceScore(95); // Strictly capped < 100%
            vr.setCompetencyLevel("Advanced");
            vr.setVerifiedAt(LocalDateTime.now());
            verificationRecordRepository.save(vr);
            
            // Update CandidateSkill
            CandidateSkill cs = candidateSkillRepository.findByCandidateIdAndSkillId(id, skillId).orElse(null);
            if (cs != null) {
                cs.setVerificationStatus("VERIFIED");
                cs.setConfidenceScore(95);
                cs.setCompetencyLevel("Advanced");
                candidateSkillRepository.save(cs);
            }
        }
        
        return ResponseEntity.ok(savedCred);
    }

    @GetMapping("/{id}/credentials")
    public ResponseEntity<List<Credential>> getCredentials(@PathVariable Long id) {
        return ResponseEntity.ok(credentialRepository.findByCandidateIdOrderByIdDesc(id));
    }
    
    @GetMapping("/{candidateId}/credentials/{skillId}")
    public ResponseEntity<Credential> getCredentialForSkill(@PathVariable Long candidateId, @PathVariable Long skillId) {
        Optional<Credential> cred = credentialRepository.findByCandidateIdAndSkillId(candidateId, skillId);
        return cred.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/verify-external-badge")
    public ResponseEntity<?> verifyExternalBadge(@RequestParam String id) {
        System.out.println("Verifying external badge: " + id);
        try {
            java.net.HttpURLConnection connection = (java.net.HttpURLConnection) new java.net.URL("https://www.credly.com/badges/" + id).openConnection();
            connection.setRequestProperty("User-Agent", "Mozilla/5.0");
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(3000);
            connection.setReadTimeout(3000);
            int responseCode = connection.getResponseCode();
            
            if (responseCode >= 200 && responseCode < 400) {
                java.io.BufferedReader in = new java.io.BufferedReader(new java.io.InputStreamReader(connection.getInputStream()));
                String inputLine;
                StringBuilder content = new StringBuilder();
                while ((inputLine = in.readLine()) != null) {
                    content.append(inputLine);
                }
                in.close();
                connection.disconnect();
                
                String html = content.toString();
                if (html.contains("Unable to verify badge") || html.contains("error-view__title")) {
                    return ResponseEntity.ok().body(java.util.Collections.singletonMap("valid", false));
                }
                return ResponseEntity.ok().body(java.util.Collections.singletonMap("valid", true));
            } else {
                return ResponseEntity.ok().body(java.util.Collections.singletonMap("valid", false));
            }
        } catch (Exception e) {
            System.out.println("Error verifying badge: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.ok().body(java.util.Collections.singletonMap("valid", false));
        }
    }

    @PostMapping("/verify-resume")
    public ResponseEntity<?> verifyResumeFile(@RequestParam("file") MultipartFile file) {
        try {
            var response = resumeVerificationService.verifyResumeFile(file);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.out.println("Error processing resume: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(java.util.Collections.singletonMap("error", "Failed to process resume: " + e.getMessage()));
        }
    }

    @PostMapping("/verify-certificate-qr")
    public ResponseEntity<?> verifyCertificateQr(@RequestParam("file") MultipartFile file) {
        try {
            var response = qrCertificateVerificationService.verifyCertificateFile(file);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.out.println("Error verifying certificate: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(java.util.Collections.singletonMap("error", "Failed to scan certificate: " + e.getMessage()));
        }
    }

    @PostMapping("/verify-qr-payload")
    public ResponseEntity<?> verifyQrPayload(@RequestBody java.util.Map<String, String> request) {
        try {
            String payload = request.getOrDefault("payload", "");
            var response = qrCertificateVerificationService.verifyPayloadDirectly(payload);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.out.println("Error verifying QR payload: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(java.util.Collections.singletonMap("error", "Failed to verify payload: " + e.getMessage()));
        }
    }

    @PostMapping("/verify-resume-text")
    public ResponseEntity<?> verifyResumeText(@RequestBody java.util.Map<String, String> request) {
        try {
            String text = request.getOrDefault("text", "");
            var response = resumeVerificationService.verifyResumeText(text);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.out.println("Error processing resume text: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(java.util.Collections.singletonMap("error", "Failed to process text: " + e.getMessage()));
        }
    }
}

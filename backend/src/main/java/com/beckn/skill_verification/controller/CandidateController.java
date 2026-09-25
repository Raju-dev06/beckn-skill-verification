package com.beckn.skill_verification.controller;

import com.beckn.skill_verification.dto.CandidateProfileDto;
import com.beckn.skill_verification.entity.Credential;
import com.beckn.skill_verification.repository.CredentialRepository;
import com.beckn.skill_verification.service.CandidateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/candidates")
@RequiredArgsConstructor
public class CandidateController {
    
    private final CandidateService candidateService;
    private final CredentialRepository credentialRepository;
    
    @GetMapping("/{id}")
    public ResponseEntity<CandidateProfileDto> getProfile(@PathVariable Long id) {
        return ResponseEntity.ok(candidateService.getCandidateProfile(id));
    }
    
    @PostMapping("/{id}/credentials")
    public ResponseEntity<Credential> addCredential(
            @PathVariable Long id,
            @RequestParam("skillId") Long skillId,
            @RequestParam("certificateName") String certificateName,
            @RequestParam("credentialId") String credentialId,
            @RequestParam("issuer") String issuer,
            @RequestParam(value = "file", required = false) MultipartFile file) throws IOException {
        
        Credential credential = credentialRepository.findByCandidateIdAndSkillId(id, skillId)
                .orElse(new Credential());
        
        credential.setCandidateId(id);
        credential.setSkillId(skillId);
        credential.setCertificateName(certificateName);
        credential.setCredentialId(credentialId);
        credential.setIssuer(issuer);
        credential.setStatus("UPLOADED");
        
        if (file != null && !file.isEmpty()) {
            String uploadDir = "uploads/";
            File dir = new File(uploadDir);
            if (!dir.exists()) dir.mkdirs();
            String filePath = uploadDir + file.getOriginalFilename();
            Path path = Paths.get(filePath);
            Files.write(path, file.getBytes());
            credential.setFilePath(filePath);
        }
        
        return ResponseEntity.ok(credentialRepository.save(credential));
    }

    @GetMapping("/{id}/credentials")
    public ResponseEntity<List<Credential>> getCredentials(@PathVariable Long id) {
        return ResponseEntity.ok(credentialRepository.findByCandidateId(id));
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
            System.out.println("Credly response code: " + responseCode);
            
            if (responseCode >= 200 && responseCode < 400) {
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
}

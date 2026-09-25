package com.beckn.skill_verification.repository;

import com.beckn.skill_verification.entity.Credential;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CredentialRepository extends JpaRepository<Credential, Long> {
    List<Credential> findByCandidateId(Long candidateId);
    Optional<Credential> findByCandidateIdAndSkillId(Long candidateId, Long skillId);
}

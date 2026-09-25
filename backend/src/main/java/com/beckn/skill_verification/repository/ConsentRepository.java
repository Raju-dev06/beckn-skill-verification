package com.beckn.skill_verification.repository;

import com.beckn.skill_verification.entity.Consent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ConsentRepository extends JpaRepository<Consent, Long> {
    Optional<Consent> findByCandidateIdAndSkillId(Long candidateId, Long skillId);
}

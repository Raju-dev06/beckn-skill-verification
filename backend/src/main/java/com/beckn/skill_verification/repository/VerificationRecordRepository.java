package com.beckn.skill_verification.repository;

import com.beckn.skill_verification.entity.VerificationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VerificationRecordRepository extends JpaRepository<VerificationRecord, Long> {
    List<VerificationRecord> findByCandidateId(Long candidateId);
    VerificationRecord findByCandidateIdAndSkillId(Long candidateId, Long skillId);
}

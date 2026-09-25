package com.beckn.skill_verification.repository;
import com.beckn.skill_verification.entity.VerificationHistory;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VerificationHistoryRepository extends JpaRepository<VerificationHistory, Long> {
    List<VerificationHistory> findByCandidateIdOrderByCreatedAtDesc(Long candidateId);
}

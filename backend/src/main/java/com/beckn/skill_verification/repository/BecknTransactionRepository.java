package com.beckn.skill_verification.repository;
import com.beckn.skill_verification.entity.BecknTransaction;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BecknTransactionRepository extends JpaRepository<BecknTransaction, Long> {
    Optional<BecknTransaction> findByTransactionIdAndAction(String transactionId, String action);
    Optional<BecknTransaction> findByMessageId(String messageId);
}

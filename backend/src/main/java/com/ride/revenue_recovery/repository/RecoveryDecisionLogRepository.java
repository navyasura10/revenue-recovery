package com.ride.revenue_recovery.repository;

import com.ride.revenue_recovery.entity.RecoveryDecisionLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecoveryDecisionLogRepository
        extends JpaRepository<RecoveryDecisionLog, Long> {

    List<RecoveryDecisionLog> findByPaymentIdOrderByCreatedAtDesc(
            String paymentId
    );
}
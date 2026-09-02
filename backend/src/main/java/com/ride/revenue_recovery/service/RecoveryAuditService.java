package com.ride.revenue_recovery.service;

import com.ride.revenue_recovery.entity.FailureCategory;
import com.ride.revenue_recovery.entity.RecoveryDecision;
import com.ride.revenue_recovery.entity.RecoveryDecisionLog;
import com.ride.revenue_recovery.repository.RecoveryDecisionLogRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class RecoveryAuditService {

    private final RecoveryDecisionLogRepository repository;

    public RecoveryAuditService(
            RecoveryDecisionLogRepository repository) {

        this.repository = repository;
    }

    public RecoveryDecisionLog recordDecision(
            String paymentId,
            int amount,
            String currency,
            FailureCategory category,
            int attemptNumber,
            int revenueAtRisk,
            RecoveryDecision decision) {

        RecoveryDecisionLog log =
                new RecoveryDecisionLog();

        log.setPaymentId(paymentId);
        log.setAmount(amount);
        log.setCurrency(currency);
        log.setFailureCategory(category);
        log.setAttemptNumber(attemptNumber);
        log.setRevenueAtRisk(revenueAtRisk);

        log.setAction(
                decision.getAction()
        );

        log.setReason(
                decision.getReason()
        );

        log.setRequiresHumanApproval(
                decision.isRequiresHumanApproval()
        );

        log.setActionAllowed(
                decision.isActionAllowed()
        );

        log.setCreatedAt(
                LocalDateTime.now()
        );
        log.setAiRecommendedAction(
                decision.getAiRecommendedAction()
        );

        log.setAiReason(
                decision.getAiReason()
        );

        log.setAiConfidence(
                decision.getAiConfidence()
        );

        log.setAiOverridden(
                decision.isAiOverridden()
        );
        log.setAiFallback(
                decision.getAiFallback()
        );
        return repository.save(log);
    }
}
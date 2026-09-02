package com.ride.revenue_recovery.service;

import com.ride.revenue_recovery.entity.FailureCategory;
import org.springframework.stereotype.Service;

@Service
public class RecoveryPolicyGuard {

    public String validate(
            String aiAction,
            double aiConfidence,
            FailureCategory category,
            int amount,
            int attemptNumber) {

        // Maximum automatic attempts
        if (attemptNumber >= 3) {
            return "HUMAN_REVIEW";
        }

        // High-value transaction
        // Amount is in paise.
        // ₹10,000 = 1,000,000 paise.
        if (amount >= 1_000_000) {
            return "HUMAN_REVIEW";
        }

        // Permanent failures must never be retried
        if (category == FailureCategory.PERMANENT_FAILURE) {
            return "DO_NOT_RETRY";
        }

        // Unknown failures require investigation
        if (category == FailureCategory.UNKNOWN) {
            return "HUMAN_REVIEW";
        }

        // Low-confidence AI recommendation
        if (aiConfidence < 0.60) {
            return "HUMAN_REVIEW";
        }

        // Customer must take action
        if (category == FailureCategory.CUSTOMER_ACTION_REQUIRED) {
            return "CUSTOMER_ACTION";
        }

        // Only known actions can pass
        if (!isAllowed(aiAction)) {
            return "HUMAN_REVIEW";
        }

        return aiAction;
    }

    private boolean isAllowed(String action) {

        return action.equals("CONTROLLED_RETRY")
                || action.equals("RETRY_LATER")
                || action.equals("CUSTOMER_ACTION")
                || action.equals("DO_NOT_RETRY")
                || action.equals("HUMAN_REVIEW");
    }
}
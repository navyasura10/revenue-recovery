package com.ride.revenue_recovery.service;

import com.ride.revenue_recovery.entity.FailureCategory;
import com.ride.revenue_recovery.entity.RecoveryAction;
import com.ride.revenue_recovery.entity.RecoveryDecision;
import org.springframework.stereotype.Service;

@Service
public class RecoveryDecisionService {

    // ₹10,000 = 1,000,000 paise
    private static final int HUMAN_APPROVAL_LIMIT = 1_000_000;

    private static final int MAX_AUTOMATIC_ATTEMPTS = 2;

    public RecoveryDecision decide(
            FailureCategory category,
            int amount,
            int previousAttempts) {

        /*
         * Safety rule:
         * Too many attempts → stop automatic recovery.
         */
        if (previousAttempts >= MAX_AUTOMATIC_ATTEMPTS) {

            return new RecoveryDecision(
                    RecoveryAction.HUMAN_REVIEW,
                    "Maximum automatic recovery attempts reached",
                    true,
                    false
            );
        }

        /*
         * High-value transaction → human approval.
         */
        if (amount >= HUMAN_APPROVAL_LIMIT) {

            return new RecoveryDecision(
                    RecoveryAction.HUMAN_REVIEW,
                    "High-value payment requires human approval",
                    true,
                    false
            );
        }

        switch (category) {

            case BANK_TIMEOUT:

                return new RecoveryDecision(
                        RecoveryAction.RETRY_LATER,
                        "Temporary bank/network timeout detected",
                        false,
                        true
                );

            case TEMPORARY_FAILURE:

                return new RecoveryDecision(
                        RecoveryAction.CONTROLLED_RETRY,
                        "Temporary payment processing failure",
                        false,
                        true
                );

            case CUSTOMER_ACTION_REQUIRED:

                return new RecoveryDecision(
                        RecoveryAction.CUSTOMER_ACTION,
                        "Customer intervention is required",
                        false,
                        true
                );

            case PERMANENT_FAILURE:

                return new RecoveryDecision(
                        RecoveryAction.DO_NOT_RETRY,
                        "Failure appears permanent; automatic retry is unsafe",
                        false,
                        false
                );

            case UNKNOWN:

            default:

                return new RecoveryDecision(
                        RecoveryAction.HUMAN_REVIEW,
                        "Insufficient information for safe recovery",
                        true,
                        false
                );
        }
    }
}
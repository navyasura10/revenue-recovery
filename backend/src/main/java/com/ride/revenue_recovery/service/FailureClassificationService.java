package com.ride.revenue_recovery.service;

import com.ride.revenue_recovery.entity.FailureCategory;
import org.springframework.stereotype.Service;

@Service
public class FailureClassificationService {

    public FailureCategory classify(
            String errorCode,
            String errorReason,
            String errorDescription) {

        String combined = (
                safe(errorCode) + " " +
                        safe(errorReason) + " " +
                        safe(errorDescription)
        ).toLowerCase();

        System.out.println("=== FAILURE CLASSIFICATION ===");
        System.out.println("errorCode        = " + errorCode);
        System.out.println("errorReason      = " + errorReason);
        System.out.println("errorDescription = " + errorDescription);
        System.out.println("combined         = " + combined);

        // =====================================================
        // 1. BANK / NETWORK TIMEOUT
        // =====================================================

        if (containsAny(
                combined,
                "timeout",
                "timed out",
                "gateway timeout",
                "bank timeout",
                "network timeout",
                "connection timeout",
                "issuer timeout",
                "timedout",
                "gateway_timed_out",
                "bank_timeout"
        )) {
            return FailureCategory.BANK_TIMEOUT;
        }

        // =====================================================
        // 2. CUSTOMER ACTION REQUIRED
        // =====================================================

        if (containsAny(
                combined,
                "authentication",
                "authentication failed",
                "authentication_failure",
                "otp",
                "otp_required",
                "invalid pin",
                "incorrect pin",
                "action required",
                "customer action",
                "customer_action_required",
                "verify",
                "verification required",
                "authorization required",
                "authorization_failed",
                "user action",
                "user_action_required",
                "payment authentication"
        )) {
            return FailureCategory.CUSTOMER_ACTION_REQUIRED;
        }

        // =====================================================
        // 3. PERMANENT FAILURE
        // =====================================================
        System.out.println("PERMANENT CHECK: " + combined.contains("payment_failed"));
        System.out.println("DECLINED CHECK: " + combined.contains("declined"));

        if (containsAny(
                combined,
                "insufficient funds",
                "insufficient_funds",
                "card not supported",
                "card_not_supported",
                "expired",
                "expired card",
                "expired_card",
                "blocked",
                "card blocked",
                "not permitted",
                "not_permitted",
                "declined",
                "declined permanently",
                "declined by the bank",
                "bank declined",
                "bank_declined",
                "payment_failed",
                "payment failed",
                "permanent failure",
                "permanent_failure",
                "invalid",
                "invalid account",
                "invalid_account",
                "invalid card",
                "invalid_card",
                "incorrect card",
                "do not honor",
                "do_not_honor"
        )) {
            return FailureCategory.PERMANENT_FAILURE;
        }

        // =====================================================
        // 4. TEMPORARY FAILURE
        // =====================================================

        if (containsAny(
                combined,
                "network",
                "temporary",
                "temporary_failure",
                "processing error",
                "processing_error",
                "service unavailable",
                "service_unavailable",
                "server error",
                "server_error",
                "try again",
                "try_again",
                "temporarily unavailable",
                "technical error",
                "technical_error",
                "internal error",
                "internal_error",
                "gateway error",
                "gateway_error",
                "system error",
                "system_error"
        )) {
            return FailureCategory.TEMPORARY_FAILURE;
        }

        // =====================================================
        // 5. UNKNOWN
        // =====================================================

        return FailureCategory.UNKNOWN;
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private boolean containsAny(
            String text,
            String... values) {

        for (String value : values) {
            if (text.contains(value)) {
                return true;
            }
        }

        return false;
    }
}
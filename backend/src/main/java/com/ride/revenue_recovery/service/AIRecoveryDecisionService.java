package com.ride.revenue_recovery.service;

import com.ride.revenue_recovery.entity.FailureCategory;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class AIRecoveryDecisionService {

    private final RestTemplate restTemplate;

    private static final String AI_URL =
            "http://127.0.0.1:8000/api/ai/decision";

    public AIRecoveryDecisionService() {
        this.restTemplate = new RestTemplate();
    }

    // =====================================================
    // REAL AI CALL
    // =====================================================

    @CircuitBreaker(
            name = "aiDecision",
            fallbackMethod = "fallbackDecision"
    )
    public Map<String, Object> getDecision(
            int amount,
            String currency,
            String paymentMethod,
            int attemptNumber,
            String failureCategory,
            int previousAttempts,
            String customerHistory,
            double recentFailureRate) {

        Map<String, Object> request = Map.of(
                "amount", amount,
                "currency", currency,
                "payment_method", paymentMethod,
                "attempt_number", attemptNumber,
                "failure_category", failureCategory,
                "previous_attempts", previousAttempts,
                "customer_history", customerHistory,
                "recent_failure_rate", recentFailureRate
        );

        return restTemplate.postForObject(
                AI_URL,
                request,
                Map.class
        );
    }

    // =====================================================
    // FALLBACK
    // =====================================================

    public Map<String, Object> fallbackDecision(
            int amount,
            String currency,
            String paymentMethod,
            int attemptNumber,
            String failureCategory,
            int previousAttempts,
            String customerHistory,
            double recentFailureRate,
            Throwable throwable) {

        System.out.println("======================================");
        System.out.println("⚠️ AI SERVICE UNAVAILABLE");
        System.out.println("Reason: " + throwable.getMessage());
        System.out.println("Using deterministic safety fallback.");
        System.out.println("======================================");

        return Map.of(
                "recommended_action", "HUMAN_REVIEW",
                "reason",
                "AI service unavailable. Deterministic safety fallback activated.",
                "confidence", 1.0,
                "fallback", true
        );
    }

    // =====================================================
    // MOCK AI
    // =====================================================

    public Map<String, Object> getMockDecision(
            int amount,
            FailureCategory category,
            int attemptNumber) {

        String action;
        String reason;
        double confidence;

        switch (category) {

            case BANK_TIMEOUT:
                action = "RETRY_LATER";
                reason = "Bank timeout appears temporary; retry after a delay.";
                confidence = 0.85;
                break;

            case TEMPORARY_FAILURE:
                action = "CONTROLLED_RETRY";
                reason = "Temporary payment failure may recover with a controlled retry.";
                confidence = 0.90;
                break;

            case CUSTOMER_ACTION_REQUIRED:
                action = "CUSTOMER_ACTION";
                reason = "Customer intervention is required to continue payment recovery.";
                confidence = 0.90;
                break;

            case PERMANENT_FAILURE:
                action = "DO_NOT_RETRY";
                reason = "Failure appears permanent and should not be retried.";
                confidence = 0.95;
                break;

            default:
                action = "HUMAN_REVIEW";
                reason = "Failure type is uncertain and requires human review.";
                confidence = 0.60;
        }

        return Map.of(
                "recommended_action", action,
                "reason", reason,
                "confidence", confidence
        );
    }
}
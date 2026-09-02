package com.ride.revenue_recovery.service;

import com.ride.revenue_recovery.entity.FailureCategory;
import com.ride.revenue_recovery.entity.RecoveryAction;
import com.ride.revenue_recovery.entity.RecoveryDecision;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class RecoveryOrchestrator {

    private final RecoveryDecisionService decisionService;
    private final RecoveryAuditService auditService;
    private final AIRecoveryDecisionService aiDecisionService;
    private final RecoveryPolicyGuard policyGuard;

    public RecoveryOrchestrator(
            RecoveryDecisionService decisionService,
            RecoveryAuditService auditService,
            AIRecoveryDecisionService aiDecisionService,
            RecoveryPolicyGuard policyGuard) {

        this.decisionService = decisionService;
        this.auditService = auditService;
        this.aiDecisionService = aiDecisionService;
        this.policyGuard = policyGuard;
    }

    public RecoveryDecision evaluate(
            String paymentId,
            int amount,
            String currency,
            FailureCategory category,
            int attemptNumber,
            int revenueAtRisk) {

        // =========================================================
        // 1. DETERMINISTIC BASELINE DECISION
        // =========================================================

        RecoveryDecision decision =
                decisionService.decide(
                        category,
                        amount,
                        attemptNumber
                );

        // =========================================================
        // 2. AI RECOMMENDATION
        // =========================================================

        Map<String, Object> aiResult =
                aiDecisionService.getDecision(
                        amount,
                        currency,
                        category.name(),
                        attemptNumber,
                        category.name(),
                        Math.max(0, attemptNumber - 1),
                        "good",
                        0.05
                );

        boolean aiFallback =
                Boolean.TRUE.equals(
                        aiResult.get("fallback")
                );

        String aiAction =
                String.valueOf(
                        aiResult.getOrDefault(
                                "recommended_action",
                                "HUMAN_REVIEW"
                        )
                );

        String aiReason =
                String.valueOf(
                        aiResult.getOrDefault(
                                "reason",
                                "No AI reason provided."
                        )
                );

        double aiConfidence =
                parseConfidence(
                        aiResult.get("confidence")
                );

        System.out.println();
        System.out.println(
                "========== AI RECOMMENDATION =========="
        );

        System.out.println(
                "AI Action: " + aiAction
        );

        System.out.println(
                "AI Confidence: " + aiConfidence
        );

        System.out.println(
                "AI Reason: " + aiReason
        );

        System.out.println(
                "AI Fallback: " + aiFallback
        );

        System.out.println(
                "======================================="
        );

        // =========================================================
        // 3. POLICY GUARD
        // =========================================================

        String finalAction;

        try {

            finalAction =
                    policyGuard.validate(
                            aiAction,
                            aiConfidence,
                            category,
                            amount,
                            attemptNumber
                    );

        } catch (Exception e) {

            System.out.println(
                    "⚠️ POLICY VALIDATION FAILED"
            );

            System.out.println(
                    "Reason: " + e.getMessage()
            );

            finalAction = "HUMAN_REVIEW";
        }

        // =========================================================
        // 4. FINAL DECISION
        // =========================================================

        try {

            decision.setAction(
                    RecoveryAction.valueOf(
                            finalAction
                    )
            );

        } catch (IllegalArgumentException e) {

            System.out.println(
                    "⚠️ INVALID FINAL ACTION: "
                            + finalAction
            );

            decision.setAction(
                    RecoveryAction.HUMAN_REVIEW
            );

            finalAction = "HUMAN_REVIEW";
        }

        decision.setAiRecommendedAction(
                aiAction
        );

        decision.setAiReason(
                aiReason
        );

        decision.setAiConfidence(
                aiConfidence
        );

        decision.setAiFallback(aiFallback);

        decision.setAiOverridden(
                !aiAction.equals(finalAction)
        );

        // =========================================================
        // 5. FINAL DECISION LOG
        // =========================================================

        System.out.println();
        System.out.println(
                "========== RIDE RECOVERY DECISION =========="
        );

        System.out.println(
                "Payment ID: " + paymentId
        );

        System.out.println(
                "Failure Category: " + category
        );

        System.out.println(
                "Attempt Number: " + attemptNumber
        );

        System.out.println(
                "Revenue At Risk: ₹"
                        + (revenueAtRisk / 100.0)
        );

        System.out.println(
                "AI Recommendation: " + aiAction
        );

        System.out.println(
                "AI Confidence: " + aiConfidence
        );

        System.out.println(
                "AI Fallback: " + aiFallback
        );

        System.out.println(
                "Policy Final Decision: " + finalAction
        );

        System.out.println(
                "AI Overridden: "
                        + !aiAction.equals(finalAction)
        );

        System.out.println(
                "============================================"
        );

        // =========================================================
        // 6. AUDIT TRAIL
        // =========================================================

        auditService.recordDecision(
                paymentId,
                amount,
                currency,
                category,
                attemptNumber,
                revenueAtRisk,
                decision
        );

        return decision;
    }

    /*
     * Safely converts AI confidence to double.
     */
    private double parseConfidence(Object value) {

        if (value instanceof Number number) {
            return number.doubleValue();
        }

        if (value instanceof String string) {

            try {
                return Double.parseDouble(string);
            } catch (NumberFormatException ignored) {
                return 0.0;
            }
        }

        return 0.0;
    }
}
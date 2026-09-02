package com.ride.revenue_recovery.service;

import com.ride.revenue_recovery.entity.FailureCategory;
import com.ride.revenue_recovery.entity.Payment;
import com.ride.revenue_recovery.entity.PaymentAttempt;
import com.ride.revenue_recovery.entity.RecoveryDecision;
import com.ride.revenue_recovery.repository.PaymentAttemptRepository;
import com.ride.revenue_recovery.repository.PaymentRepository;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Map;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final ObjectMapper objectMapper;
    private final PaymentStateService paymentStateService;
    private final PaymentAttemptRepository paymentAttemptRepository;
    private final FailureClassificationService failureClassificationService;
    private final RevenueRiskService revenueRiskService;
    private final RecoveryOrchestrator recoveryOrchestrator;

    public PaymentService(
            PaymentRepository paymentRepository,
            ObjectMapper objectMapper,
            PaymentStateService paymentStateService,
            PaymentAttemptRepository paymentAttemptRepository,
            FailureClassificationService failureClassificationService,
            RevenueRiskService revenueRiskService,
            RecoveryOrchestrator recoveryOrchestrator) {

        this.paymentRepository = paymentRepository;
        this.objectMapper = objectMapper;
        this.paymentStateService = paymentStateService;
        this.paymentAttemptRepository = paymentAttemptRepository;
        this.failureClassificationService = failureClassificationService;
        this.revenueRiskService = revenueRiskService;
        this.recoveryOrchestrator = recoveryOrchestrator;
    }

    public void processPaymentEvent(String payload) {

        try {

            // =====================================================
            // 1. PARSE WEBHOOK
            // =====================================================

            JsonNode root =
                    objectMapper.readTree(payload);

            String eventType =
                    root.path("event").asText(null);

            JsonNode payment =
                    root.path("payload")
                            .path("payment")
                            .path("entity");

            if (payment.isMissingNode()
                    || payment.isEmpty()) {

                System.out.println(
                        "⚠️ No payment data in event"
                );

                return;
            }

            String paymentId =
                    payment.path("id").asText(null);

            if (paymentId == null
                    || paymentId.isBlank()) {

                System.out.println(
                        "⚠️ Payment ID missing"
                );

                return;
            }

            System.out.println();
            System.out.println(
                    "========== PAYMENT EVENT =========="
            );

            System.out.println(
                    "Event: " + eventType
            );

            System.out.println(
                    "Payment ID: " + paymentId
            );

            // =====================================================
            // 2. UPDATE PAYMENT RECORD FIRST
           // =====================================================

            updatePaymentRecord(
                    paymentId,
                    payment
            );
            // =====================================================
           // 3. PAYMENT FAILED → RECOVERY PIPELINE
           // =====================================================

            if ("payment.failed".equals(eventType)) {

                processFailedPayment(
                        paymentId,
                        payment
                );
            }
            System.out.println(
                    "==================================="
            );

        } catch (Exception e) {

            System.out.println(
                    "❌ PAYMENT PROCESSING ERROR"
            );

            e.printStackTrace();
        }
    }

    // =============================================================
    // FAILED PAYMENT RECOVERY PIPELINE
    // =============================================================

    private void processFailedPayment(
            String paymentId,
            JsonNode payment) {

        PaymentAttempt attempt =
                recordFailedAttempt(payment);

        /*
         * If the attempt already exists, do not run the recovery
         * pipeline again.
         *
         * This protects the system against duplicate processing.
         */
        if (attempt == null) {

            System.out.println(
                    "⚠️ Recovery pipeline skipped"
            );

            return;
        }

        FailureCategory category =
                attempt.getFailureCategory();

        int attemptNumber =
                attempt.getAttemptNumber();

        int amount =
                attempt.getAmount();

        String currency =
                attempt.getCurrency();

        // =========================================================
        // REVENUE AT RISK
        // =========================================================

        Map<String, Object> risk =
                revenueRiskService.calculateRisk(
                        paymentId
                );

        Object riskValue =
                risk.get("revenueAtRisk");

        int revenueAtRisk =
                riskValue instanceof Number
                        ? ((Number) riskValue).intValue()
                        : amount;

        System.out.println();
        System.out.println(
                "========== RECOVERY PIPELINE =========="
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

        // =========================================================
        // RECOVERY ORCHESTRATOR
        // =========================================================

        RecoveryDecision decision =
                recoveryOrchestrator.evaluate(
                        paymentId,
                        amount,
                        currency,
                        category,
                        attemptNumber,
                        revenueAtRisk
                );

        System.out.println(
                "Final Recovery Action: "
                        + decision.getAction()
        );

        System.out.println(
                "========================================"
        );
    }

    // =============================================================
    // UPDATE PAYMENT
    // =============================================================

    private void updatePaymentRecord(
            String paymentId,
            JsonNode payment) {

        Payment paymentRecord =
                paymentRepository
                        .findByPaymentId(paymentId)
                        .orElseGet(Payment::new);

        paymentRecord.setPaymentId(
                paymentId
        );

        paymentRecord.setOrderId(
                payment.path("order_id")
                        .asText(null)
        );

        paymentRecord.setAmount(
                payment.path("amount")
                        .asInt()
        );

        paymentRecord.setCurrency(
                payment.path("currency")
                        .asText(null)
        );

        String newStatus =
                payment.path("status")
                        .asText(null);

        String currentStatus =
                paymentRecord.getStatus();

        /*
         * Only update status when the state transition is valid.
         */
        if (paymentStateService.canTransition(
                currentStatus,
                newStatus)) {

            paymentRecord.setStatus(
                    newStatus
            );

        } else {

            System.out.println(
                    "⚠️ INVALID STATE TRANSITION: "
                            + currentStatus
                            + " → "
                            + newStatus
            );

            return;
        }

        paymentRecord.setMethod(
                payment.path("method")
                        .asText(null)
        );

        paymentRecord.setCaptured(
                payment.path("captured")
                        .asBoolean()
        );

        paymentRecord.setAttempts(
                payment.path("attempts")
                        .asInt(0)
        );

        paymentRecord.setFailureCode(
                payment.path("error_code")
                        .asText(null)
        );

        paymentRecord.setFailureReason(
                payment.path("error_reason")
                        .asText(null)
        );

        long createdAt =
                payment.path("created_at")
                        .asLong();

        if (createdAt > 0) {

            paymentRecord.setCreatedAt(
                    LocalDateTime.ofInstant(
                            Instant.ofEpochSecond(
                                    createdAt
                            ),
                            ZoneId.systemDefault()
                    )
            );
        }

        paymentRecord.setUpdatedAt(
                LocalDateTime.now()
        );

        paymentRepository.save(
                paymentRecord
        );

        System.out.println(
                "✅ PAYMENT STATE UPDATED"
        );

        System.out.println(
                "Payment ID: " + paymentId
        );

        System.out.println(
                "Status: " + paymentRecord.getStatus()
        );
    }

    // =============================================================
    // RECORD FAILED PAYMENT ATTEMPT
    // =============================================================

    private PaymentAttempt recordFailedAttempt(
            JsonNode payment) {

        String paymentId =
                payment.path("id")
                        .asText();

        String orderId =
                payment.path("order_id")
                        .asText(null);

        int amount =
                payment.path("amount")
                        .asInt();

        String currency =
                payment.path("currency")
                        .asText(null);

        String method =
                payment.path("method")
                        .asText(null);

        String failureCode =
                payment.path("error_code")
                        .asText(null);

        String failureReason =
                payment.path("error_reason")
                        .asText(null);

        // =========================================================
        // DETERMINE ATTEMPT NUMBER
        // =========================================================

        var existingAttempts =
                paymentAttemptRepository
                        .findByOrderIdOrderByAttemptNumberAsc(
                                orderId
                        );

        int attemptNumber =
                existingAttempts.size() + 1;

        // =========================================================
        // DUPLICATE ATTEMPT PROTECTION
        // =========================================================

        if (paymentAttemptRepository
                .existsByOrderIdAndAttemptNumber(
                        orderId,
                        attemptNumber)) {

            System.out.println(
                    "⚠️ ATTEMPT ALREADY EXISTS"
            );

            return null;
        }

        PaymentAttempt attempt =
                new PaymentAttempt();

        attempt.setPaymentId(
                paymentId
        );

        attempt.setOrderId(
                orderId
        );

        attempt.setAmount(
                amount
        );

        attempt.setCurrency(
                currency
        );

        attempt.setStatus(
                "failed"
        );

        attempt.setMethod(
                method
        );

        attempt.setFailureCode(
                failureCode
        );

        attempt.setFailureReason(
                failureReason
        );

        attempt.setAttemptNumber(
                attemptNumber
        );

        attempt.setOccurredAt(
                LocalDateTime.now()
        );

        // =========================================================
        // FAILURE CLASSIFICATION
        // =========================================================

        FailureCategory category =
                failureClassificationService.classify(
                        failureCode,
                        failureReason,
                        payment.path(
                                "error_description"
                        ).asText(null)
                );

        attempt.setFailureCategory(
                category
        );

        // =========================================================
        // SAVE ATTEMPT
        // =========================================================

        PaymentAttempt savedAttempt =
                paymentAttemptRepository.save(
                        attempt
                );

        System.out.println(
                "✅ PAYMENT ATTEMPT RECORDED"
        );

        System.out.println(
                "Payment ID: " + paymentId
        );

        System.out.println(
                "Attempt: " + attemptNumber
        );

        System.out.println(
                "Failure: " + failureReason
        );

        System.out.println(
                "Category: " + category
        );

        return savedAttempt;
    }
}
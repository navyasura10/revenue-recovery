package com.ride.revenue_recovery.controller;

import com.ride.revenue_recovery.entity.WebhookEvent;
import com.ride.revenue_recovery.repository.WebhookEventRepository;
import com.ride.revenue_recovery.service.PaymentService;
import com.ride.revenue_recovery.service.WebhookSignatureService;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/webhooks")
public class RazorpayWebhookController {

    private final WebhookSignatureService signatureService;
    private final WebhookEventRepository webhookEventRepository;
    private final ObjectMapper objectMapper;
    private final PaymentService paymentService;

    public RazorpayWebhookController(
            WebhookSignatureService signatureService,
            WebhookEventRepository webhookEventRepository,
            ObjectMapper objectMapper,
            PaymentService paymentService) {

        this.signatureService = signatureService;
        this.webhookEventRepository = webhookEventRepository;
        this.objectMapper = objectMapper;
        this.paymentService = paymentService;
    }

    @PostMapping("/razorpay")
    public ResponseEntity<String> receiveWebhook(

            @RequestBody String payload,

            @RequestHeader(
                    value = "X-Razorpay-Signature",
                    required = false
            )
            String signature,

            @RequestHeader(
                    value = "x-razorpay-event-id",
                    required = false
            )
            String eventId) {

        System.out.println();
        System.out.println("========== RIDE WEBHOOK ==========");

        try {

            // =====================================================
            // 1. VERIFY RAZORPAY SIGNATURE
            // =====================================================

            boolean valid =
                    signatureService.verify(
                            payload,
                            signature
                    );

            if (!valid) {

                System.out.println(
                        "❌ INVALID WEBHOOK SIGNATURE"
                );

                return ResponseEntity
                        .badRequest()
                        .body("Invalid signature");
            }

            System.out.println(
                    "✅ VALID WEBHOOK SIGNATURE"
            );


            // =====================================================
            // 2. VALIDATE EVENT ID
            // =====================================================

            if (eventId == null || eventId.isBlank()) {

                System.out.println(
                        "❌ MISSING EVENT ID"
                );

                return ResponseEntity
                        .badRequest()
                        .body("Missing event ID");
            }

            System.out.println(
                    "Event ID: " + eventId
            );


            // =====================================================
            // 3. IDEMPOTENCY CHECK
            // =====================================================

            if (webhookEventRepository
                    .existsByEventId(eventId)) {

                System.out.println(
                        "⚠️ DUPLICATE EVENT IGNORED"
                );

                return ResponseEntity
                        .ok("Duplicate event ignored");
            }


            // =====================================================
            // 4. PARSE EVENT
            // =====================================================

            JsonNode root =
                    objectMapper.readTree(payload);

            String eventType =
                    root.path("event").asText(null);

            JsonNode paymentEntity =
                    root.path("payload")
                            .path("payment")
                            .path("entity");

            String paymentId = null;

            if (!paymentEntity.isMissingNode()) {

                paymentId =
                        paymentEntity
                                .path("id")
                                .asText(null);
            }

            System.out.println(
                    "Event Type: " + eventType
            );

            System.out.println(
                    "Payment ID: " + paymentId
            );


            // =====================================================
            // 5. SAVE WEBHOOK EVENT
            // =====================================================

            WebhookEvent webhookEvent =
                    new WebhookEvent();

            webhookEvent.setEventId(eventId);
            webhookEvent.setEventType(eventType);
            webhookEvent.setPaymentId(paymentId);
            webhookEvent.setPayload(payload);
            webhookEvent.setReceivedAt(
                    LocalDateTime.now()
            );

            webhookEvent.setProcessed(false);

            webhookEventRepository.save(
                    webhookEvent
            );

            System.out.println(
                    "✅ WEBHOOK EVENT SAVED"
            );


            // =====================================================
            // 6. PROCESS PAYMENT
            // =====================================================

            paymentService.processPaymentEvent(
                    payload
            );


            // =====================================================
            // 7. MARK EVENT PROCESSED
            // =====================================================

            webhookEvent.setProcessed(true);

            webhookEventRepository.save(
                    webhookEvent
            );

            System.out.println(
                    "✅ WEBHOOK PROCESSED"
            );

            System.out.println(
                    "================================="
            );


            // =====================================================
            // 8. ACKNOWLEDGE RAZORPAY
            // =====================================================

            return ResponseEntity
                    .ok("Webhook processed");

        } catch (Exception e) {

            System.out.println(
                    "❌ WEBHOOK PROCESSING FAILED"
            );

            e.printStackTrace();

            return ResponseEntity
                    .internalServerError()
                    .body("Webhook processing failed");
        }
    }
}
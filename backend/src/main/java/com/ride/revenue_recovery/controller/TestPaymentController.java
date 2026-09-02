package com.ride.revenue_recovery.controller;

import com.ride.revenue_recovery.service.TestPaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/test-payments")
@CrossOrigin(origins = "http://localhost:5173")
public class TestPaymentController {

    private final TestPaymentService testPaymentService;

    public TestPaymentController(TestPaymentService testPaymentService) {
        this.testPaymentService = testPaymentService;
    }

    /**
     * Create a new Razorpay Test Mode order.
     *
     * POST /api/test-payments/orders
     *
     * Body:
     * {
     *   "amount": 200
     * }
     */
    @PostMapping("/orders")
    public ResponseEntity<?> createOrder(
            @RequestBody Map<String, Object> request
    ) {

        try {

            Object amountValue = request.get("amount");

            if (amountValue == null) {
                return ResponseEntity.badRequest().body(
                        Map.of(
                                "success", false,
                                "message", "Amount is required."
                        )
                );
            }

            long amountRupees;

            try {
                amountRupees =
                        Long.parseLong(
                                String.valueOf(amountValue)
                        );
            } catch (NumberFormatException e) {

                return ResponseEntity.badRequest().body(
                        Map.of(
                                "success", false,
                                "message", "Amount must be a valid number."
                        )
                );
            }

            if (amountRupees <= 0) {

                return ResponseEntity.badRequest().body(
                        Map.of(
                                "success", false,
                                "message", "Amount must be greater than ₹0."
                        )
                );
            }

            return ResponseEntity.ok(
                    testPaymentService.createOrder(amountRupees)
            );

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity.internalServerError().body(
                    Map.of(
                            "success", false,
                            "message",
                            "Unable to create Razorpay test order.",
                            "error",
                            e.getMessage() == null
                                    ? "Unknown error"
                                    : e.getMessage()
                    )
            );
        }
    }

    /**
     * Returns the Razorpay public test key.
     *
     * GET /api/test-payments/config
     */
    @GetMapping("/config")
    public ResponseEntity<?> getConfig() {

        return ResponseEntity.ok(
                Map.of(
                        "keyId",
                        testPaymentService.getKeyId()
                )
        );
    }
}
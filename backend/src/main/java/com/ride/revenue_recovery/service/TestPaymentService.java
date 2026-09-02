package com.ride.revenue_recovery.service;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class TestPaymentService {

    private final String keyId;
    private final String keySecret;

    public TestPaymentService(
            @Value("${razorpay.key.id}") String keyId,
            @Value("${razorpay.key.secret}") String keySecret
    ) {
        this.keyId = keyId;
        this.keySecret = keySecret;
    }

    /**
     * Creates a Razorpay Test Mode order.
     *
     * Razorpay expects amount in paise.
     *
     * Example:
     *
     * ₹200 -> 20000 paise
     * ₹500 -> 50000 paise
     */
    public Map<String, Object> createOrder(long amountRupees)
            throws Exception {

        long amountPaise = amountRupees * 100;

        RazorpayClient razorpayClient =
                new RazorpayClient(
                        keyId,
                        keySecret
                );

        String receipt =
                "RIDE_" +
                        System.currentTimeMillis() +
                        "_" +
                        UUID.randomUUID()
                                .toString()
                                .substring(0, 8);

        JSONObject orderRequest =
                new JSONObject();

        orderRequest.put(
                "amount",
                amountPaise
        );

        orderRequest.put(
                "currency",
                "INR"
        );

        orderRequest.put(
                "receipt",
                receipt
        );

        JSONObject notes =
                new JSONObject();

        notes.put(
                "source",
                "RIDE_TEST_PAYMENT"
        );

        notes.put(
                "environment",
                "TEST"
        );

        orderRequest.put(
                "notes",
                notes
        );

        Order order =
                razorpayClient.orders.create(
                        orderRequest
                );

        Map<String, Object> response =
                new HashMap<>();

        response.put(
                "success",
                true
        );

        response.put(
                "orderId",
                order.get("id")
        );

        response.put(
                "amount",
                order.get("amount")
        );

        response.put(
                "currency",
                order.get("currency")
        );

        response.put(
                "receipt",
                order.get("receipt")
        );

        response.put(
                "status",
                order.get("status")
        );

        response.put(
                "keyId",
                keyId
        );

        return response;
    }

    public String getKeyId() {
        return keyId;
    }
}
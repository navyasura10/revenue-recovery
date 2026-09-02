package com.ride.revenue_recovery.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

@Service
public class WebhookSignatureService {

    @Value("${razorpay.webhook.secret}")
    private String webhookSecret;

    public boolean verify(String payload, String receivedSignature) {

        if (payload == null || receivedSignature == null) {
            return false;
        }

        try {
            Mac mac = Mac.getInstance("HmacSHA256");

            SecretKeySpec secretKeySpec =
                    new SecretKeySpec(
                            webhookSecret.getBytes(StandardCharsets.UTF_8),
                            "HmacSHA256"
                    );

            mac.init(secretKeySpec);

            byte[] hash =
                    mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));

            StringBuilder generatedSignature = new StringBuilder();

            for (byte b : hash) {
                generatedSignature.append(String.format("%02x", b));
            }

            return generatedSignature
                    .toString()
                    .equals(receivedSignature);

        } catch (Exception e) {
            return false;
        }
    }
}
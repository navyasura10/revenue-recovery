package com.ride.revenue_recovery.service;

import com.ride.revenue_recovery.entity.Payment;
import com.ride.revenue_recovery.repository.PaymentRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class RevenueRiskService {

    private final PaymentRepository paymentRepository;

    public RevenueRiskService(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    public Map<String, Object> calculateRisk(String paymentId) {

        Payment payment = paymentRepository
                .findByPaymentId(paymentId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Payment not found: " + paymentId
                        ));

        Map<String, Object> result = new HashMap<>();

        int amount = payment.getAmount() != null
                ? payment.getAmount()
                : 0;

        String status = payment.getStatus();

        boolean recovered =
                Boolean.TRUE.equals(payment.getCaptured())
                        || "captured".equalsIgnoreCase(status)
                        || "paid".equalsIgnoreCase(status);

        int revenueAtRisk = recovered ? 0 : amount;
        int recoveredRevenue = recovered ? amount : 0;

        result.put("paymentId", payment.getPaymentId());
        result.put("orderId", payment.getOrderId());
        result.put("amount", amount);
        result.put("currency", payment.getCurrency());
        result.put("status", status);
        result.put("recovered", recovered);
        result.put("revenueAtRisk", revenueAtRisk);
        result.put("recoveredRevenue", recoveredRevenue);

        return result;
    }
}
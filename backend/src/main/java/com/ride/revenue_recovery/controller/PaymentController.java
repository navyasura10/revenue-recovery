package com.ride.revenue_recovery.controller;

import com.ride.revenue_recovery.entity.Payment;
import com.ride.revenue_recovery.repository.PaymentRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "http://localhost:5173")
public class PaymentController {

    private final PaymentRepository paymentRepository;

    public PaymentController(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    @GetMapping
    public List<Payment> getPayments() {
        return paymentRepository.findAll();
    }
}
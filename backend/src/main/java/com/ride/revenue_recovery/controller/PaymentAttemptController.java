package com.ride.revenue_recovery.controller;

import com.ride.revenue_recovery.entity.PaymentAttempt;
import com.ride.revenue_recovery.repository.PaymentAttemptRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payment-attempts")
@CrossOrigin(origins = "http://localhost:5173")
public class PaymentAttemptController {

    private final PaymentAttemptRepository repository;

    public PaymentAttemptController(PaymentAttemptRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<PaymentAttempt> getAttempts() {
        return repository.findAll();
    }
}
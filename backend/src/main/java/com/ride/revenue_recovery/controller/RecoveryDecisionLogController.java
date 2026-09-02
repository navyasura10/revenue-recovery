package com.ride.revenue_recovery.controller;

import com.ride.revenue_recovery.entity.RecoveryDecisionLog;
import com.ride.revenue_recovery.repository.RecoveryDecisionLogRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recovery-decisions")
@CrossOrigin(origins = "http://localhost:5173")
public class RecoveryDecisionLogController {

    private final RecoveryDecisionLogRepository repository;

    public RecoveryDecisionLogController(
            RecoveryDecisionLogRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<RecoveryDecisionLog> getDecisions() {
        return repository.findAll();
    }

    @GetMapping("/payment/{paymentId}")
    public List<RecoveryDecisionLog> getByPayment(
            @PathVariable String paymentId) {

        return repository
                .findByPaymentIdOrderByCreatedAtDesc(paymentId);
    }
}
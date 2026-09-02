package com.ride.revenue_recovery.repository;

import com.ride.revenue_recovery.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByPaymentId(String paymentId);

    boolean existsByPaymentId(String paymentId);
}
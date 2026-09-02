package com.ride.revenue_recovery.repository;

import com.ride.revenue_recovery.entity.PaymentAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentAttemptRepository
        extends JpaRepository<PaymentAttempt, Long> {

    List<PaymentAttempt> findByOrderIdOrderByAttemptNumberAsc(
            String orderId
    );

    boolean existsByOrderIdAndAttemptNumber(
            String orderId,
            Integer attemptNumber
    );
}
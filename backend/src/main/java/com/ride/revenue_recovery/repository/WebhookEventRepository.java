package com.ride.revenue_recovery.repository;

import com.ride.revenue_recovery.entity.WebhookEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WebhookEventRepository extends JpaRepository<WebhookEvent, Long> {

    boolean existsByEventId(String eventId);
}
package com.ride.revenue_recovery.service;

import org.springframework.stereotype.Service;

@Service
public class PaymentStateService {

    public boolean canTransition(
            String currentState,
            String newState) {

        if (currentState == null || currentState.isBlank()) {
            return true;
        }

        if (newState == null || newState.isBlank()) {
            return false;
        }

        // Same state is always okay
        if (currentState.equals(newState)) {
            return true;
        }

        // Final states cannot move backwards
        if (currentState.equals("paid")) {
            return false;
        }

        if (currentState.equals("captured")
                && (newState.equals("authorized")
                || newState.equals("created")
                || newState.equals("failed"))) {
            return false;
        }

        if (currentState.equals("authorized")
                && newState.equals("created")) {
            return false;
        }

        return true;
    }
}
package com.ride.revenue_recovery.entity;

public enum RecoveryAction {

    CONTROLLED_RETRY,
    RETRY_LATER,
    CUSTOMER_ACTION,
    DO_NOT_RETRY,
    HUMAN_REVIEW
}
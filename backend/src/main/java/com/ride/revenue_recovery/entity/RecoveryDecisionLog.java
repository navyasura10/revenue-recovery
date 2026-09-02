package com.ride.revenue_recovery.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "recovery_decision_logs")
public class RecoveryDecisionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String paymentId;

    private Integer amount;

    private String currency;

    @Enumerated(EnumType.STRING)
    private FailureCategory failureCategory;

    private Integer attemptNumber;

    private Integer revenueAtRisk;

    @Enumerated(EnumType.STRING)
    private RecoveryAction action;

    @Column(length = 500)
    private String reason;

    private boolean requiresHumanApproval;

    private boolean actionAllowed;

    private LocalDateTime createdAt;
    @Column(name = "ai_recommended_action")
    private String aiRecommendedAction;

    @Column(name = "ai_reason", length = 1000)
    private String aiReason;

    @Column(name = "ai_confidence")
    private Double aiConfidence;

    @Column(name = "ai_overridden")
    private Boolean aiOverridden;

    @Column(name = "ai_fallback")
    private Boolean aiFallback;

    public Long getId() {
        return id;
    }

    public String getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(String paymentId) {
        this.paymentId = paymentId;
    }

    public Integer getAmount() {
        return amount;
    }

    public void setAmount(Integer amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public FailureCategory getFailureCategory() {
        return failureCategory;
    }

    public void setFailureCategory(FailureCategory failureCategory) {
        this.failureCategory = failureCategory;
    }

    public Integer getAttemptNumber() {
        return attemptNumber;
    }

    public void setAttemptNumber(Integer attemptNumber) {
        this.attemptNumber = attemptNumber;
    }

    public Integer getRevenueAtRisk() {
        return revenueAtRisk;
    }

    public void setRevenueAtRisk(Integer revenueAtRisk) {
        this.revenueAtRisk = revenueAtRisk;
    }

    public RecoveryAction getAction() {
        return action;
    }

    public void setAction(RecoveryAction action) {
        this.action = action;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public boolean isRequiresHumanApproval() {
        return requiresHumanApproval;
    }

    public void setRequiresHumanApproval(boolean requiresHumanApproval) {
        this.requiresHumanApproval = requiresHumanApproval;
    }

    public boolean isActionAllowed() {
        return actionAllowed;
    }

    public void setActionAllowed(boolean actionAllowed) {
        this.actionAllowed = actionAllowed;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    public String getAiRecommendedAction() {
        return aiRecommendedAction;
    }

    public void setAiRecommendedAction(String aiRecommendedAction) {
        this.aiRecommendedAction = aiRecommendedAction;
    }

    public String getAiReason() {
        return aiReason;
    }

    public void setAiReason(String aiReason) {
        this.aiReason = aiReason;
    }

    public Double getAiConfidence() {
        return aiConfidence;
    }

    public void setAiConfidence(Double aiConfidence) {
        this.aiConfidence = aiConfidence;
    }

    public Boolean isAiOverridden() {
        return aiOverridden;
    }

    public void setAiOverridden(Boolean aiOverridden) {
        this.aiOverridden = aiOverridden;
    }

    public Boolean isAiFallback() {
        return aiFallback;
    }

    public void setAiFallback(Boolean aiFallback) {
        this.aiFallback = aiFallback;
    }
}
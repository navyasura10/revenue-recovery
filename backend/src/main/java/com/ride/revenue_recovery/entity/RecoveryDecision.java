package com.ride.revenue_recovery.entity;


public class RecoveryDecision {

    private RecoveryAction action;
    private String reason;
    private boolean requiresHumanApproval;
    private boolean actionAllowed;
    private String aiRecommendedAction;

    private String aiReason;

    private Double aiConfidence;

    private boolean aiOverridden;

    private Boolean aiFallback;


    public RecoveryDecision(
            RecoveryAction action,
            String reason,
            boolean requiresHumanApproval,
            boolean actionAllowed) {

        this.action = action;
        this.reason = reason;
        this.requiresHumanApproval = requiresHumanApproval;
        this.actionAllowed = actionAllowed;
    }

    public RecoveryAction getAction() {
        return action;
    }

    public String getReason() {
        return reason;
    }

    public boolean isRequiresHumanApproval() {
        return requiresHumanApproval;
    }

    public boolean isActionAllowed() {
        return actionAllowed;
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

    public boolean isAiOverridden() {
        return aiOverridden;
    }

    public void setAiOverridden(boolean aiOverridden) {
        this.aiOverridden = aiOverridden;
    }

    public void setAction(RecoveryAction action) {
        this.action = action;
    }

    public Boolean getAiFallback() {
        return aiFallback;
    }

    public void setAiFallback(Boolean aiFallback) {
        this.aiFallback = aiFallback;
    }
}
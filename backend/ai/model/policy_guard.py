import sys
import os

sys.path.append(
    os.path.dirname(os.path.abspath(__file__))
)
from ai_decision import AIDecision
from telemetry_input import TelemetryInput


ALLOWED_ACTIONS = {
    "CONTROLLED_RETRY",
    "RETRY_LATER",
    "CUSTOMER_ACTION",
    "DO_NOT_RETRY",
    "HUMAN_REVIEW"
}


class PolicyGuard:

    def validate(
            self,
            telemetry: TelemetryInput,
            ai_decision: AIDecision
    ) -> AIDecision:

        action = ai_decision.recommended_action

        # --------------------------------
        # Rule 1: Invalid AI action
        # --------------------------------

        if action not in ALLOWED_ACTIONS:

            return AIDecision(
                recommended_action="HUMAN_REVIEW",
                reason="AI returned an unsupported recovery action.",
                confidence=1.0
            )

        # --------------------------------
        # Rule 2: High-value transaction
        # --------------------------------

        # Amount is stored in paise.
        # ₹10,00,000 = 100000000 paise

        if telemetry.amount >= 1_000_000:

            return AIDecision(
                recommended_action="HUMAN_REVIEW",
                reason="High-value payment requires human review.",
                confidence=1.0
            )

        # --------------------------------
        # Rule 3: Too many attempts
        # --------------------------------

        if telemetry.attempt_number >= 3:

            return AIDecision(
                recommended_action="HUMAN_REVIEW",
                reason="Maximum automatic recovery attempts reached.",
                confidence=1.0
            )

        # --------------------------------
        # Rule 4: Permanent failure
        # --------------------------------

        if telemetry.failure_category == "PERMANENT_FAILURE":

            return AIDecision(
                recommended_action="DO_NOT_RETRY",
                reason="Permanent failure cannot be automatically retried.",
                confidence=1.0
            )

        # --------------------------------
        # Rule 5: Unknown failure
        # --------------------------------

        if telemetry.failure_category == "UNKNOWN":

            return AIDecision(
                recommended_action="HUMAN_REVIEW",
                reason="Unknown failure requires human investigation.",
                confidence=1.0
            )

        # --------------------------------
        # Rule 6: Customer action required
        # --------------------------------

        if telemetry.failure_category == "CUSTOMER_ACTION_REQUIRED":

            if action != "CUSTOMER_ACTION":

                return AIDecision(
                    recommended_action="CUSTOMER_ACTION",
                    reason="Customer action is required before recovery can continue.",
                    confidence=1.0
                )

        # --------------------------------
        # Rule 7: Low AI confidence
        # --------------------------------

        if ai_decision.confidence < 0.60:

            return AIDecision(
                recommended_action="HUMAN_REVIEW",
                reason="AI confidence is below the minimum safety threshold.",
                confidence=1.0
            )

        # --------------------------------
        # Rule 8: Accept AI recommendation
        # --------------------------------

        return ai_decision
import sys
import os

sys.path.append(
    os.path.dirname(os.path.abspath(__file__))
)
from ai_decision import AIDecision
from telemetry_input import TelemetryInput


class AIDecisionEngine:

    def decide(self, telemetry: TelemetryInput):

        if telemetry.failure_category == "BANK_TIMEOUT":

            if telemetry.attempt_number <= 1:
                return AIDecision(
                    recommended_action="RETRY_LATER",
                    reason="The payment shows a temporary bank timeout with limited previous attempts.",
                    confidence=0.85
                )

            return AIDecision(
                recommended_action="HUMAN_REVIEW",
                reason="Repeated bank timeout requires additional review.",
                confidence=0.70
            )

        if telemetry.failure_category == "TEMPORARY_FAILURE":

            return AIDecision(
                recommended_action="CONTROLLED_RETRY",
                reason="The failure appears temporary and may recover with a controlled retry.",
                confidence=0.82
            )

        if telemetry.failure_category == "CUSTOMER_ACTION_REQUIRED":

            return AIDecision(
                recommended_action="CUSTOMER_ACTION",
                reason="The payment requires an action from the customer.",
                confidence=0.90
            )

        if telemetry.failure_category == "PERMANENT_FAILURE":

            return AIDecision(
                recommended_action="DO_NOT_RETRY",
                reason="The failure appears permanent, so another automatic attempt is not recommended.",
                confidence=0.94
            )

        return AIDecision(
            recommended_action="HUMAN_REVIEW",
            reason="Insufficient information for a safe automated recovery decision.",
            confidence=0.50
        )
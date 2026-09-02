import sys
import os

sys.path.append(
    os.path.dirname(os.path.abspath(__file__))
)

from google import genai
from google.genai import types

from ai_decision import AIDecision
from telemetry_input import TelemetryInput


class GeminiDecisionEngine:

    def __init__(self):

        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            raise RuntimeError(
                "GEMINI_API_KEY environment variable is not set"
            )

        self.client = genai.Client(
            api_key=api_key
        )

        self.model = "gemini-3.6-flash"

    def decide(
            self,
            telemetry: TelemetryInput
    ) -> AIDecision:

        prompt = f"""
You are the reasoning component of RIDE,
a defensive AI revenue recovery system.

Your job is ONLY to recommend the safest recovery action.

You must NOT:
- charge the customer
- modify payment amounts
- invent payment information
- bypass policy
- approve high-value transactions
- execute any payment operation

Use ONLY the supplied telemetry.

Telemetry:

Amount: {telemetry.amount} paise
Currency: {telemetry.currency}
Payment method: {telemetry.payment_method}
Attempt number: {telemetry.attempt_number}
Failure category: {telemetry.failure_category}
Previous attempts: {telemetry.previous_attempts}
Customer history: {telemetry.customer_history}
Recent failure rate: {telemetry.recent_failure_rate}

Allowed actions:

CONTROLLED_RETRY
RETRY_LATER
CUSTOMER_ACTION
DO_NOT_RETRY
HUMAN_REVIEW

Choose the safest appropriate recommendation.

Keep the reason concise and based only on the telemetry.
"""

        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AIDecision
            )
        )

        return AIDecision.model_validate_json(
            response.text
        )
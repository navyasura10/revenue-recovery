import sys
import os

sys.path.append(
    os.path.dirname(os.path.abspath(__file__))
)
from gemini_decision_engine import GeminiDecisionEngine
from telemetry_input import TelemetryInput


engine = GeminiDecisionEngine()


telemetry = TelemetryInput(
    amount=500000,
    currency="INR",
    payment_method="netbanking",
    attempt_number=1,
    failure_category="BANK_TIMEOUT",
    previous_attempts=0,
    customer_history="good",
    recent_failure_rate=0.03
)


print("===================================")
print("RIDE GEMINI TEST")
print("===================================")

result = engine.decide(telemetry)

print("Recommended Action:")
print(result.recommended_action)

print("\nReason:")
print(result.reason)

print("\nConfidence:")
print(result.confidence)

print("\n===================================")
print("TEST COMPLETED")
print("===================================")
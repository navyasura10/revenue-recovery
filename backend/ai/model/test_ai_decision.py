import sys
import os

sys.path.append(
    os.path.dirname(os.path.abspath(__file__))
)
from ai_decision_engine import AIDecisionEngine
from telemetry_input import TelemetryInput


engine = AIDecisionEngine()


test_cases = [
    TelemetryInput(
        amount=500000,
        currency="INR",
        payment_method="netbanking",
        attempt_number=1,
        failure_category="BANK_TIMEOUT",
        previous_attempts=0,
        customer_history="good",
        recent_failure_rate=0.03
    ),

    TelemetryInput(
        amount=500000,
        currency="INR",
        payment_method="netbanking",
        attempt_number=1,
        failure_category="TEMPORARY_FAILURE",
        previous_attempts=0,
        customer_history="good",
        recent_failure_rate=0.10
    ),

    TelemetryInput(
        amount=500000,
        currency="INR",
        payment_method="card",
        attempt_number=1,
        failure_category="CUSTOMER_ACTION_REQUIRED",
        previous_attempts=0,
        customer_history="average",
        recent_failure_rate=0.20
    ),

    TelemetryInput(
        amount=500000,
        currency="INR",
        payment_method="card",
        attempt_number=1,
        failure_category="PERMANENT_FAILURE",
        previous_attempts=0,
        customer_history="poor",
        recent_failure_rate=0.50
    ),

    TelemetryInput(
        amount=500000,
        currency="INR",
        payment_method="wallet",
        attempt_number=1,
        failure_category="UNKNOWN",
        previous_attempts=0,
        customer_history="unknown",
        recent_failure_rate=0.40
    )
]


expected_actions = [
    "RETRY_LATER",
    "CONTROLLED_RETRY",
    "CUSTOMER_ACTION",
    "DO_NOT_RETRY",
    "HUMAN_REVIEW"
]


print("===================================")
print("RIDE AI DECISION ENGINE TEST")
print("===================================")

passed = 0

for i, (telemetry, expected) in enumerate(
        zip(test_cases, expected_actions), 1):

    result = engine.decide(telemetry)

    print(f"\nTest {i}")
    print("Failure:", telemetry.failure_category)
    print("Expected:", expected)
    print("Actual:", result.recommended_action)
    print("Reason:", result.reason)
    print("Confidence:", result.confidence)

    if result.recommended_action == expected:
        print("✅ PASS")
        passed += 1
    else:
        print("❌ FAIL")


print("\n===================================")
print(f"RESULT: {passed}/{len(test_cases)} PASSED")
print("===================================")
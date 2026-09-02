import sys
import os

sys.path.append(
    os.path.dirname(os.path.abspath(__file__))
)
from policy_guard import PolicyGuard
from ai_decision import AIDecision
from telemetry_input import TelemetryInput


guard = PolicyGuard()


def run_test(name, telemetry, ai_decision, expected):
    result = guard.validate(
        telemetry,
        ai_decision
    )

    passed = (
            result.recommended_action
            == expected
    )

    print(f"\n{name}")
    print("AI recommendation:", ai_decision.recommended_action)
    print("Final decision:", result.recommended_action)
    print("Reason:", result.reason)

    if passed:
        print("✅ PASS")
    else:
        print("❌ FAIL")

    return passed


# ---------------------------------------
# Test 1: Safe retry should be accepted
# ---------------------------------------

telemetry_1 = TelemetryInput(
    amount=500000,
    currency="INR",
    payment_method="netbanking",
    attempt_number=1,
    failure_category="TEMPORARY_FAILURE",
    previous_attempts=0,
    customer_history="good",
    recent_failure_rate=0.05
)

ai_1 = AIDecision(
    recommended_action="CONTROLLED_RETRY",
    reason="Temporary failure may recover with a controlled retry.",
    confidence=0.90
)


# ---------------------------------------
# Test 2: Too many attempts
# AI says retry, policy must block it
# ---------------------------------------

telemetry_2 = TelemetryInput(
    amount=500000,
    currency="INR",
    payment_method="netbanking",
    attempt_number=3,
    failure_category="TEMPORARY_FAILURE",
    previous_attempts=2,
    customer_history="good",
    recent_failure_rate=0.10
)

ai_2 = AIDecision(
    recommended_action="CONTROLLED_RETRY",
    reason="Try another retry.",
    confidence=0.95
)


# ---------------------------------------
# Test 3: Permanent failure
# AI incorrectly says retry
# ---------------------------------------

telemetry_3 = TelemetryInput(
    amount=500000,
    currency="INR",
    payment_method="card",
    attempt_number=1,
    failure_category="PERMANENT_FAILURE",
    previous_attempts=0,
    customer_history="average",
    recent_failure_rate=0.20
)

ai_3 = AIDecision(
    recommended_action="CONTROLLED_RETRY",
    reason="Retry may recover the payment.",
    confidence=0.95
)


# ---------------------------------------
# Test 4: Unknown failure
# AI says retry
# ---------------------------------------

telemetry_4 = TelemetryInput(
    amount=500000,
    currency="INR",
    payment_method="wallet",
    attempt_number=1,
    failure_category="UNKNOWN",
    previous_attempts=0,
    customer_history="unknown",
    recent_failure_rate=0.30
)

ai_4 = AIDecision(
    recommended_action="CONTROLLED_RETRY",
    reason="Retry could recover the payment.",
    confidence=0.95
)


# ---------------------------------------
# Test 5: High-value payment
# AI says retry
# ---------------------------------------

telemetry_5 = TelemetryInput(
    amount=1_000_000,
    currency="INR",
    payment_method="netbanking",
    attempt_number=1,
    failure_category="TEMPORARY_FAILURE",
    previous_attempts=0,
    customer_history="good",
    recent_failure_rate=0.05
)

ai_5 = AIDecision(
    recommended_action="CONTROLLED_RETRY",
    reason="Temporary failure.",
    confidence=0.95
)


# ---------------------------------------
# Test 6: Low AI confidence
# ---------------------------------------

telemetry_6 = TelemetryInput(
    amount=500000,
    currency="INR",
    payment_method="netbanking",
    attempt_number=1,
    failure_category="BANK_TIMEOUT",
    previous_attempts=0,
    customer_history="good",
    recent_failure_rate=0.05
)

ai_6 = AIDecision(
    recommended_action="RETRY_LATER",
    reason="Possibly temporary bank issue.",
    confidence=0.40
)


# ---------------------------------------
# Run tests
# ---------------------------------------

print("===================================")
print("RIDE POLICY GUARD TEST")
print("===================================")

tests = [

    (
        "TEST 1 — Safe recommendation",
        telemetry_1,
        ai_1,
        "CONTROLLED_RETRY"
    ),

    (
        "TEST 2 — Maximum attempts",
        telemetry_2,
        ai_2,
        "HUMAN_REVIEW"
    ),

    (
        "TEST 3 — Permanent failure",
        telemetry_3,
        ai_3,
        "DO_NOT_RETRY"
    ),

    (
        "TEST 4 — Unknown failure",
        telemetry_4,
        ai_4,
        "HUMAN_REVIEW"
    ),

    (
        "TEST 5 — High-value payment",
        telemetry_5,
        ai_5,
        "HUMAN_REVIEW"
    ),

    (
        "TEST 6 — Low AI confidence",
        telemetry_6,
        ai_6,
        "HUMAN_REVIEW"
    )
]


passed = 0

for name, telemetry, ai_decision, expected in tests:

    if run_test(
            name,
            telemetry,
            ai_decision,
            expected
    ):
        passed += 1


print("\n===================================")
print(
    f"RESULT: {passed}/{len(tests)} PASSED"
)
print("===================================")
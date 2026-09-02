import pandas as pd


TEST_FILE = "../data/held_out_test.csv"

df = pd.read_csv(TEST_FILE)


def baseline_decision(row):

    category = row["failure_category"]
    amount = row["amount"]
    attempts = row["attempt_number"]

    # Same safety rules as RIDE
    if attempts >= 3:
        return "HUMAN_REVIEW"

    if amount >= 1_000_000:
        return "HUMAN_REVIEW"

    if category == "BANK_TIMEOUT":
        return "RETRY_LATER"

    if category == "TEMPORARY_FAILURE":
        return "CONTROLLED_RETRY"

    if category == "CUSTOMER_ACTION_REQUIRED":
        return "CUSTOMER_ACTION"

    if category == "PERMANENT_FAILURE":
        return "DO_NOT_RETRY"

    return "HUMAN_REVIEW"


df["baseline_action"] = df.apply(
    baseline_decision,
    axis=1
)


# --------------------------------
# Basic totals
# --------------------------------

total_cases = len(df)

total_revenue_at_risk = df[
    "revenue_at_risk"
].sum()

actual_recovered = df[
    "recovered_amount"
].sum()


# --------------------------------
# Baseline recommended actions
# --------------------------------

action_counts = df[
    "baseline_action"
].value_counts()


# --------------------------------
# Decision agreement
# --------------------------------

decision_match = (
        df["baseline_action"]
        == df["recommended_action"]
)

matching_decisions = decision_match.sum()

decision_accuracy = (
                            matching_decisions / total_cases
                    ) * 100


# --------------------------------
# Recovery metrics
# --------------------------------

recovery_rate = (
                        actual_recovered /
                        total_revenue_at_risk
                ) * 100


# --------------------------------
# Print results
# --------------------------------

print("===================================")
print("RIDE BASELINE EVALUATION")
print("===================================")

print(f"Test cases: {total_cases}")

print(
    f"Revenue at risk: "
    f"₹{total_revenue_at_risk / 100:,.2f}"
)

print(
    f"Actual recovered revenue: "
    f"₹{actual_recovered / 100:,.2f}"
)

print(
    f"Observed recovery rate: "
    f"{recovery_rate:.2f}%"
)

print(
    f"Baseline decision agreement: "
    f"{decision_accuracy:.2f}%"
)

print("\nBaseline Actions:")
print(action_counts)

print("\nFailure Category → Baseline Action:")
print(
    pd.crosstab(
        df["failure_category"],
        df["baseline_action"]
    )
)

print("\nActual Outcomes:")
print(
    df["actual_outcome"].value_counts()
)
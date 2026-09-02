import random
import pandas as pd

random.seed(42)

NUM_RECORDS = 1000

failure_categories = [
    "BANK_TIMEOUT",
    "TEMPORARY_FAILURE",
    "CUSTOMER_ACTION_REQUIRED",
    "PERMANENT_FAILURE",
    "UNKNOWN"
]

payment_methods = [
    "netbanking",
    "card",
    "wallet"
]

records = []

for i in range(1, NUM_RECORDS + 1):

    payment_id = f"pay_SYN_{i:04d}"

    amount = random.choice([
        10000,       # ₹100
        25000,       # ₹250
        50000,       # ₹500
        100000,      # ₹1,000
        250000,      # ₹2,500
        500000,      # ₹5,000
        1000000,     # ₹10,000
        5000000      # ₹50,000
    ])

    payment_method = random.choice(payment_methods)

    category = random.choices(
        failure_categories,
        weights=[25, 25, 20, 20, 10]
    )[0]

    attempt_number = random.randint(1, 3)

    previous_attempts = attempt_number - 1

    customer_history = random.choice([
        "good",
        "average",
        "poor",
        "unknown"
    ])

    recent_failure_rate = round(
        random.uniform(0.0, 0.8),
        2
    )

    revenue_at_risk = amount

    # -----------------------------
    # Determine expected action
    # -----------------------------

    if category == "BANK_TIMEOUT":

        if amount >= 1000000 or attempt_number >= 3:
            recommended_action = "HUMAN_REVIEW"
        else:
            recommended_action = "RETRY_LATER"

    elif category == "TEMPORARY_FAILURE":

        if attempt_number >= 3:
            recommended_action = "HUMAN_REVIEW"
        else:
            recommended_action = "CONTROLLED_RETRY"

    elif category == "CUSTOMER_ACTION_REQUIRED":

        recommended_action = "CUSTOMER_ACTION"

    elif category == "PERMANENT_FAILURE":

        recommended_action = "DO_NOT_RETRY"

    else:

        recommended_action = "HUMAN_REVIEW"

    # -----------------------------
    # Simulate realistic outcome
    # -----------------------------

    recovery_probability = 0.0

    if category == "BANK_TIMEOUT":
        recovery_probability = 0.75

    elif category == "TEMPORARY_FAILURE":
        recovery_probability = 0.60

    elif category == "CUSTOMER_ACTION_REQUIRED":
        recovery_probability = 0.50

    elif category == "PERMANENT_FAILURE":
        recovery_probability = 0.05

    else:
        recovery_probability = 0.20

    # More attempts → lower recovery probability
    recovery_probability -= previous_attempts * 0.15

    # Poor customer history → lower probability
    if customer_history == "poor":
        recovery_probability -= 0.10

    # High recent failure rate → lower probability
    if recent_failure_rate > 0.6:
        recovery_probability -= 0.10

    recovery_probability = max(
        0.0,
        min(1.0, recovery_probability)
    )

    recovered = (
            random.random() < recovery_probability
    )

    if recovered:
        actual_outcome = "recovered"
        recovered_amount = amount
    else:
        actual_outcome = "not_recovered"
        recovered_amount = 0

    records.append({
        "payment_id": payment_id,
        "amount": amount,
        "currency": "INR",
        "payment_method": payment_method,
        "attempt_number": attempt_number,
        "failure_category": category,
        "revenue_at_risk": revenue_at_risk,
        "previous_attempts": previous_attempts,
        "customer_history": customer_history,
        "recent_failure_rate": recent_failure_rate,
        "recommended_action": recommended_action,
        "actual_outcome": actual_outcome,
        "recovered_amount": recovered_amount
    })


# Create DataFrame
df = pd.DataFrame(records)

# Shuffle rows
df = df.sample(
    frac=1,
    random_state=42
).reset_index(drop=True)

# Save complete dataset
df.to_csv(
    "telemetry_dataset.csv",
    index=False
)

# Create held-out test set
test_size = int(len(df) * 0.20)

held_out_test = df.iloc[:test_size]

held_out_test.to_csv(
    "held_out_test.csv",
    index=False
)

print("===================================")
print("RIDE DATASET GENERATED")
print("===================================")

print(f"Total records: {len(df)}")
print(f"Held-out records: {len(held_out_test)}")
print(f"Development records: {len(df) - len(held_out_test)}")

print("\nFailure Category Distribution:")
print(df["failure_category"].value_counts())

print("\nRecovery Outcome Distribution:")
print(df["actual_outcome"].value_counts())

print("\nRecommended Action Distribution:")
print(df["recommended_action"].value_counts())

print("\nDataset files created:")
print("telemetry_dataset.csv")
print("held_out_test.csv")
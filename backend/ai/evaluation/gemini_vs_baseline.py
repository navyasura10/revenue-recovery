import sys
import os
import pandas as pd
import time

# Allow importing from ../model
sys.path.append(
    os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "model")
    )
)

from telemetry_input import TelemetryInput
from gemini_decision_engine import GeminiDecisionEngine


# ============================================================
# FILES
# ============================================================

TEST_FILE = "../data/held_out_test.csv"

OUTPUT_FILE = (
    "../data/gemini_vs_baseline_results.csv"
)

# Gemini free-tier calls available for this run
DAILY_LIMIT = 20


# ============================================================
# BASELINE DECISION
# ============================================================

def baseline_decision(row):

    category = row["failure_category"]
    amount = row["amount"]
    attempts = row["attempt_number"]

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


# ============================================================
# CREATE TELEMETRY
# ============================================================

def create_telemetry(row):

    return TelemetryInput(
        amount=int(row["amount"]),
        currency=row["currency"],
        payment_method=row["payment_method"],
        attempt_number=int(row["attempt_number"]),
        failure_category=row["failure_category"],
        previous_attempts=int(row["previous_attempts"]),
        customer_history=row["customer_history"],
        recent_failure_rate=float(
            row["recent_failure_rate"]
        )
    )


# ============================================================
# START
# ============================================================

print("===================================")
print("RIDE GEMINI vs BASELINE")
print("===================================")


# ============================================================
# LOAD COMPLETE 200-CASE DATASET
# ============================================================

df = pd.read_csv(TEST_FILE)

print(
    f"\nTotal held-out cases available: {len(df)}"
)


# ============================================================
# LOAD EXISTING RESULTS
# ============================================================

if os.path.exists(OUTPUT_FILE):

    existing_results = pd.read_csv(
        OUTPUT_FILE
    )

    print(
        f"Existing Gemini results: "
        f"{len(existing_results)}"
    )

else:

    existing_results = pd.DataFrame()

    print(
        "No previous Gemini results found."
    )


# ============================================================
# DETERMINE ALREADY PROCESSED CASES
# ============================================================

if not existing_results.empty:

    processed_ids = set(
        existing_results["payment_id"]
        .astype(str)
    )

else:

    processed_ids = set()


# ============================================================
# FIND REMAINING CASES
# ============================================================

remaining_df = df[
    ~df["payment_id"]
    .astype(str)
    .isin(processed_ids)
].copy()


remaining_df = remaining_df.reset_index(
    drop=True
)


print(
    f"Remaining cases: "
    f"{len(remaining_df)}"
)


# ============================================================
# CHECK WHETHER EVALUATION IS COMPLETE
# ============================================================

if len(remaining_df) == 0:

    print("\n===================================")
    print("ALL 200 CASES ALREADY EVALUATED")
    print("===================================")

    sys.exit(0)


# ============================================================
# TAKE ONLY TODAY'S 20 CASES
# ============================================================

today_df = remaining_df.head(
    DAILY_LIMIT
).copy()


print(
    f"Cases to process today: "
    f"{len(today_df)}"
)

print(
    f"Cases after this run: "
    f"{len(existing_results) + len(today_df)}/"
    f"{len(df)}"
)


# ============================================================
# GEMINI
# ============================================================

gemini = GeminiDecisionEngine()

new_results = []


# ============================================================
# PROCESS NEW CASES
# ============================================================

for index, row in today_df.iterrows():

    overall_case_number = (
            len(existing_results)
            + index
            + 1
    )

    print(
        f"\nProcessing case "
        f"{overall_case_number}/{len(df)}..."
    )

    baseline = baseline_decision(row)

    telemetry = create_telemetry(row)

    try:

        ai_result = gemini.decide(
            telemetry
        )

        gemini_action = (
            ai_result.recommended_action
        )

        confidence = (
            ai_result.confidence
        )

        reason = (
            ai_result.reason
        )

        print(
            f"Gemini: {gemini_action}"
        )

        print(
            f"Confidence: {confidence}"
        )

        # Small delay to avoid hitting rate limits
        time.sleep(2)

    except Exception as e:

        print(
            "Gemini error:",
            e
        )

        gemini_action = "HUMAN_REVIEW"

        confidence = 0.0

        reason = (
            "Gemini failure - "
            "escalated to human review"
        )


    new_results.append({

        "payment_id":
            row["payment_id"],

        "failure_category":
            row["failure_category"],

        "amount":
            row["amount"],

        "baseline_action":
            baseline,

        "gemini_action":
            gemini_action,

        "gemini_confidence":
            confidence,

        "gemini_reason":
            reason,

        "actual_outcome":
            row["actual_outcome"],

        "recovered_amount":
            row["recovered_amount"]
    })


# ============================================================
# CREATE NEW RESULTS DATAFRAME
# ============================================================

new_results_df = pd.DataFrame(
    new_results
)


# ============================================================
# APPEND TO EXISTING RESULTS
# ============================================================

if existing_results.empty:

    results_df = new_results_df

else:

    results_df = pd.concat(
        [
            existing_results,
            new_results_df
        ],
        ignore_index=True
    )


# ============================================================
# REMOVE ACCIDENTAL DUPLICATES
# ============================================================

results_df = (
    results_df
    .drop_duplicates(
        subset=["payment_id"],
        keep="first"
    )
    .reset_index(drop=True)
)


# ============================================================
# SAVE
# ============================================================

results_df.to_csv(
    OUTPUT_FILE,
    index=False
)


# ============================================================
# OVERALL EVALUATION
# ============================================================

# Match results back to the original dataset
evaluation_df = df[
    df["payment_id"]
    .astype(str)
    .isin(
        results_df["payment_id"]
        .astype(str)
    )
].copy()


# Make sure order is consistent
evaluation_df = (
    evaluation_df
    .set_index("payment_id")
    .loc[
        results_df["payment_id"]
    ]
    .reset_index()
)


# ============================================================
# BASELINE AGREEMENT
# ============================================================

baseline_accuracy = (
                            results_df["baseline_action"]
                            .astype(str)
                            ==
                            evaluation_df["recommended_action"]
                            .astype(str)
                    ).mean() * 100


# ============================================================
# GEMINI AGREEMENT
# ============================================================

gemini_accuracy = (
                          results_df["gemini_action"]
                          .astype(str)
                          ==
                          evaluation_df["recommended_action"]
                          .astype(str)
                  ).mean() * 100


# ============================================================
# HUMAN REVIEW
# ============================================================

baseline_human_review = (
                                results_df["baseline_action"]
                                == "HUMAN_REVIEW"
                        ).mean() * 100


gemini_human_review = (
                              results_df["gemini_action"]
                              == "HUMAN_REVIEW"
                      ).mean() * 100


# ============================================================
# ACTION DISTRIBUTION
# ============================================================

baseline_actions = (
    results_df["baseline_action"]
    .value_counts()
)

gemini_actions = (
    results_df["gemini_action"]
    .value_counts()
)


# ============================================================
# FINAL OUTPUT
# ============================================================

print("\n===================================")
print("EVALUATION PROGRESS")
print("===================================")

print(
    f"Evaluated cases: "
    f"{len(results_df)}/{len(df)}"
)

print(
    f"Remaining cases: "
    f"{len(df) - len(results_df)}"
)


print("\n===================================")
print("OVERALL COMPARISON")
print("===================================")

print(
    f"\nBaseline agreement: "
    f"{baseline_accuracy:.2f}%"
)

print(
    f"Gemini agreement: "
    f"{gemini_accuracy:.2f}%"
)

print(
    f"\nBaseline human review: "
    f"{baseline_human_review:.2f}%"
)

print(
    f"Gemini human review: "
    f"{gemini_human_review:.2f}%"
)


print("\nBaseline Actions:")
print(
    baseline_actions
)


print("\nGemini Actions:")
print(
    gemini_actions
)


print("\n===================================")
print("RESULTS SAVED")
print("===================================")

print(
    OUTPUT_FILE
)


if len(results_df) < len(df):

    print(
        f"\nNext run will continue from "
        f"case {len(results_df) + 1}."
    )

else:

    print(
        "\n🎉 ALL 200 CASES COMPLETED!"
    )


print("\n===================================")
print("EVALUATION COMPLETE")
print("===================================")
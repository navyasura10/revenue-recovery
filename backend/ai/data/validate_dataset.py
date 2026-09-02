import pandas as pd

df = pd.read_csv("telemetry_dataset.csv")

print("===================================")
print("RIDE DATASET VALIDATION")
print("===================================")

print("\nShape:")
print(df.shape)

print("\nMissing values:")
print(df.isnull().sum())

print("\nDuplicate payment IDs:")
print(df["payment_id"].duplicated().sum())

print("\nFailure categories:")
print(df["failure_category"].value_counts())

print("\nRecommended actions:")
print(df["recommended_action"].value_counts())

print("\nOutcome:")
print(df["actual_outcome"].value_counts())

print("\nAmount statistics:")
print(df["amount"].describe())

print("\nFailure category → recommended action:")
print(
    pd.crosstab(
        df["failure_category"],
        df["recommended_action"]
    )
)

print("\nFailure category → outcome:")
print(
    pd.crosstab(
        df["failure_category"],
        df["actual_outcome"]
    )
)
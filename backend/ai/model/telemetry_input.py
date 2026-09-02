from dataclasses import dataclass


@dataclass
class TelemetryInput:

    amount: int
    currency: str
    payment_method: str
    attempt_number: int
    failure_category: str
    previous_attempts: int
    customer_history: str
    recent_failure_rate: float
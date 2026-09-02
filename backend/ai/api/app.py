from fastapi import FastAPI
from pydantic import BaseModel

from model.telemetry_input import TelemetryInput
from model.gemini_decision_engine import GeminiDecisionEngine


app = FastAPI(
    title="RIDE AI Decision Service",
    version="1.0"
)

engine = GeminiDecisionEngine()


class DecisionRequest(BaseModel):
    amount: int
    currency: str
    payment_method: str
    attempt_number: int
    failure_category: str
    previous_attempts: int
    customer_history: str
    recent_failure_rate: float


@app.get("/health")
def health():
    return {
        "status": "UP",
        "service": "RIDE AI Decision Service"
    }


@app.post("/api/ai/decision")
def get_decision(request: DecisionRequest):

    telemetry = TelemetryInput(
        amount=request.amount,
        currency=request.currency,
        payment_method=request.payment_method,
        attempt_number=request.attempt_number,
        failure_category=request.failure_category,
        previous_attempts=request.previous_attempts,
        customer_history=request.customer_history,
        recent_failure_rate=request.recent_failure_rate
    )

    decision = engine.decide(telemetry)

    return {
        "recommended_action": decision.recommended_action,
        "reason": decision.reason,
        "confidence": decision.confidence
    }
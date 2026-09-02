from pydantic import BaseModel, Field
from typing import Literal


AllowedAction = Literal[
    "CONTROLLED_RETRY",
    "RETRY_LATER",
    "CUSTOMER_ACTION",
    "DO_NOT_RETRY",
    "HUMAN_REVIEW"
]


class AIDecision(BaseModel):

    recommended_action: AllowedAction = Field(
        description="Recommended recovery action"
    )

    reason: str = Field(
        description="Short explanation based only on the supplied telemetry"
    )

    confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Confidence between 0 and 1"
    )
# RIDE – Revenue Intelligence Decision Engine

### AI-Assisted Revenue Recovery Decision Engine

RIDE is an AI-assisted revenue recovery decision engine designed to help merchants identify, prioritize, and manage revenue-at-risk payment cases.

Instead of treating every failed payment the same way, RIDE analyzes payment failures, payment history, attempt patterns, revenue risk, and operational signals to recommend an appropriate recovery action.

The system combines **Gemini-based AI reasoning** with **deterministic policy guardrails** so that AI recommendations cannot directly bypass predefined safety rules.

> **Core Principle: AI recommends. Deterministic policy controls.**

---

# Problem

Merchants can have a large number of failed or at-risk payment cases.

Not every failed payment should receive the same recovery treatment.

For example:

- A temporary bank timeout may be worth retrying.
- A customer-action-required failure may require customer intervention.
- A permanently declined payment should not be repeatedly retried.
- A high-value case may deserve human review.
- Repeated recovery attempts may increase operational risk without improving recovery.

A simple retry-everything strategy can waste recovery effort, while stopping too early can leave recoverable revenue behind.

RIDE addresses this decision problem by acting as an intelligent decision layer between payment signals and recovery actions.

---

# Solution

RIDE analyzes each revenue-at-risk case and produces an explainable recovery recommendation.

The system considers signals such as:

- Payment amount
- Failure category
- Payment attempt history
- Number of previous attempts
- Time since failure
- Previous recovery outcomes
- Payment status
- Dispute state
- Recent operational signals

The AI generates a structured recommendation containing:

- Diagnosis
- Recommended action
- Supporting evidence
- Confidence
- Risk flags
- Reasoning

The recommendation is then passed through a deterministic policy layer.

The policy layer decides whether the recommendation is actually allowed.

This prevents an AI model from directly executing an unsafe or excessive recovery action.

---

# Architecture

```text
                                            RIDE ARCHITECTURE

 ┌──────────────────────────────────────────────────────────────┐
 │                     Razorpay Test Mode                       │
 │                                                              │
 │   Orders → Checkout → Payments → Payment Events/Webhooks     │
 └────────────────────────────┬─────────────────────────────────┘
                              │
                              ▼
 ┌──────────────────────────────────────────────────────────────┐
 │                    Spring Boot Backend                       │
 │                                                              │
 │  ┌────────────────┐     ┌────────────────────────────────┐  │
 │  │ Webhook        │────▶│ Payment / Attempt Processing   │  │
 │  │ Controller     │     └────────────────────────────────┘  │
 │  └────────────────┘                    │                     │
 │                                        ▼                     │
 │  ┌────────────────┐     ┌────────────────────────────────┐  │
 │  │ Failure        │────▶│ Revenue Risk Service            │  │
 │  │ Classification │     └────────────────────────────────┘  │
 │  └────────────────┘                    │                     │
 │                                        ▼                     │
 │                           ┌────────────────────────────┐     │
 │                           │ Recovery Orchestrator      │     │
 │                           └──────────────┬─────────────┘     │
 │                                          │                   │
 └──────────────────────────────────────────┼───────────────────┘
                                            │
                                            ▼
                              ┌────────────────────────┐
                              │     AI Decision Layer  │
                              │                        │
                              │ Gemini Decision Engine │
                              │ Structured Reasoning   │
                              └────────────┬───────────┘
                                           │
                                           ▼
                              ┌────────────────────────┐
                              │   Recovery Policy      │
                              │       Guard            │
                              │                        │
                              │ Retry limits           │
                              │ Safety rules           │
                              │ Risk controls          │
                              │ Stop conditions        │
                              └────────────┬───────────┘
                                           │
                              ┌────────────┴────────────┐
                              ▼                         ▼
                       ┌──────────────┐         ┌──────────────┐
                       │ Approved     │         │ Human Review │
                       │ Recovery     │         │ / Stop       │
                       └──────┬───────┘         └──────────────┘
                              │
                              ▼
                       ┌──────────────┐
                       │ Verification │
                       └──────┬───────┘
                              │
                              ▼
                       ┌──────────────┐
                       │ Audit Log    │
                       └──────────────┘


 ┌──────────────────────────────────────────────────────────────┐
 │                       PostgreSQL                             │
 │                                                              │
 │ Payments | Payment Attempts | Recovery Decisions             │
 │ Audit Logs | Webhook Events                                  │
 └──────────────────────────────────────────────────────────────┘


 ┌──────────────────────────────────────────────────────────────┐
 │                       React Dashboard                        │
 │                                                              │
 │ Overview | Recovery Cases | AI Decisions | Audit Trail       │
 │ Evaluation | Test Payments                                  │
 └──────────────────────────────────────────────────────────────┘


 ┌──────────────────────────────────────────────────────────────┐
 │                  Python Evaluation Layer                     │
 │                                                              │
 │ Synthetic Dataset → Baseline → Gemini → Comparison           │
 │                       ↓                                      │
 │              Held-out Evaluation Results                     │
 └──────────────────────────────────────────────────────────────┘

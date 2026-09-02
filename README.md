# RIDE — Revenue Intelligence Decision Engine

**AI-Assisted Fintech Revenue Recovery & Decision Intelligence**

RIDE is an AI-assisted revenue recovery decision engine that helps merchants decide **what recovery action should be considered for a payment case, and whether that action is safe to allow.**

Instead of treating every failed payment the same way, RIDE analyzes payment failures, attempt history, revenue at risk, and recovery signals to generate an explainable recommendation.

The core principle behind the system:

> **AI recommends. Deterministic policy controls.**

The AI can recommend an action, but it does not directly control the recovery workflow. A deterministic policy layer validates every recommendation before it can be approved.

---

## Table of Contents

- [Why RIDE?](#why-ride)
- [How It Works](#how-it-works)
- [Core Features](#core-features)
- [Dashboard](#dashboard)
- [Recovery Lifecycle](#recovery-lifecycle)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)

---

## Why RIDE?

A failed payment does not always mean the same thing.

Some failures are temporary and worth retrying. Others require customer action, human review, or should simply be stopped. Repeatedly retrying every failed payment wastes recovery effort, while stopping too early leaves recoverable revenue behind.

RIDE addresses this decision problem by combining:

- Payment failure analysis
- Revenue-at-risk calculation
- AI-based decision intelligence
- Deterministic safety policies
- Recovery state management
- Explainable decisions
- Audit logging
- Controlled evaluation

---

## How It Works

At a high level, a payment case moves through the following process:

```
Razorpay Test Mode
        ↓
Payment / Webhook
        ↓
Payment & Attempt Storage
        ↓
Failure Classification
        ↓
Revenue Risk Analysis
        ↓
AI Recommendation
        ↓
Policy Validation
        ↓
Approved Action / Escalation / Stop
        ↓
Verification & Audit Trail
        ↓
RIDE Dashboard
```

The important separation is between **decision generation** and **action authorization**:

```
                AI
                 |
                 | Recommendation
                 v
        +-------------------+
        |  Deterministic    |
        |   Policy Guard    |
        +-------------------+
                 |
          +------+------+
          |             |
       Allowed       Blocked
          |             |
          v             v
       Action       Escalation
                       / Stop
```

This prevents an AI model from having unrestricted control over financial recovery actions.

---

## Core Features

### 1. AI Recovery Decision Engine

RIDE analyzes a payment case using signals such as:

- Payment amount
- Failure category
- Previous payment attempts
- Payment history
- Previous recovery outcomes
- Dispute status
- Recent payment behavior
- Recovery attempt patterns

The AI produces a structured recommendation containing:

- Case ID
- Diagnosis
- Recommended Action
- Evidence
- Confidence
- Risk Flags
- Reasoning

Possible recommendations include:

- `CONTROLLED_RETRY`
- `RETRY_LATER`
- `CUSTOMER_ACTION_REQUIRED`
- `HUMAN_ESCALATION`
- `STOP`

The AI is used for decision intelligence, not unrestricted autonomous execution.

### 2. Deterministic Policy Guard

The policy layer validates AI recommendations using deterministic rules, including:

- Maximum recovery attempts
- Retry limits
- Failure category restrictions
- Dispute-state checks
- Stopping conditions
- Human escalation requirements
- Risk-based action restrictions

This creates a clear separation: **AI decides what could be done. Policy decides what is allowed.**

### 3. Payment Failure Classification

RIDE classifies available payment failure information into operational categories:

- `BANK_TIMEOUT`
- `TEMPORARY_FAILURE`
- `CUSTOMER_ACTION_REQUIRED`
- `PERMANENT_FAILURE`
- `UNKNOWN`

The classifier uses information available from payment errors, including error code, error reason, and error description. For example:

```
international_transaction_not_allowed
                ↓
       PERMANENT_FAILURE
```

Not every Checkout failure creates a backend payment event. When a scenario cannot be reliably reproduced through Razorpay Test Mode, controlled synthetic data is used for evaluation instead.

### 4. Revenue-at-Risk Calculation

RIDE calculates revenue risk at the order/case level, rather than summing the amount of every payment attempt.

```
Order Amount = ₹200

Attempt 1  → Failed
Attempt 2  → Failed
Attempt 3  → Failed
...
Attempt 11 → Failed

Revenue at Risk = ₹200
```

This prevents repeated attempts from artificially inflating the revenue-at-risk figure.

### 5. Recovery Case Management

RIDE treats payment attempts and revenue cases as distinct concepts. A single order may contain several payment attempts:

```
Order
 ├── Attempt 1 → Failed
 ├── Attempt 2 → Failed
 ├── Attempt 3 → Failed
 ├── Attempt 4 → Failed
 └── Attempt 5 → Successful
```

The dashboard allows a user to inspect:

- Revenue at risk
- Payment status
- Attempt history
- Failure category
- AI recommendation
- AI confidence
- AI reasoning
- Final recovery action
- Policy decision
- Recovery timeline

The case view respects the selected payment attempt so that later events do not incorrectly appear in an earlier case snapshot.

### 6. Razorpay Test Mode Integration

RIDE uses Razorpay Test Mode to demonstrate the payment lifecycle without using real customer money. The integration includes:

- Test order creation
- Razorpay Checkout
- Payment events
- Webhooks
- Webhook signature verification
- Payment storage
- Payment attempt tracking
- Recovery workflow triggering

Relevant payment events include `payment.authorized`, `payment.captured`, `payment.failed`, and `order.paid`.

> Test Mode is used for development and demonstration only. No production merchant or customer payment data is required.

### 7. Recovery Decisions & Audit Trail

Recovery decisions are stored so the reasoning behind a decision can be reviewed later. Decision records can contain:

- Payment / Order
- AI Recommendation
- AI Confidence
- AI Reason
- Final Action
- Policy Result
- Override Status
- Decision Timestamp

This makes it possible to answer:

- What happened?
- Why was the case considered risky?
- What did the AI recommend?
- Was the recommendation allowed?
- What final action was selected?

### 8. AI vs Baseline Evaluation

RIDE includes an evaluation pipeline that compares Gemini recommendations with a deterministic baseline.

```
Synthetic / Held-Out Data
            |
       +----+----+
       |         |
       v         v
   Baseline    Gemini
       |         |
       +----+----+
            |
            v
       Comparison
            |
            v
      Evaluation CSV
            |
            v
      RIDE Dashboard
```

The evaluation data includes fields such as `payment_id`, `failure_category`, `amount`, `baseline_action`, `gemini_action`, `gemini_confidence`, `gemini_reason`, `actual_outcome`, and `recovered_amount`.

This provides a way to evaluate the AI using controlled scenarios instead of relying only on qualitative claims.

**Data is intentionally separated:**

| Source | Purpose |
|---|---|
| Razorpay Test Mode | Integration & Demonstration |
| Synthetic Dataset | Controlled Evaluation |
| Held-Out Dataset | Unseen Evaluation Scenarios |

This distinction is maintained so that test payment events are never presented as real production outcomes.

---

## Dashboard

RIDE provides a React-based dashboard with the following sections:

| Section | Description |
|---|---|
| **Overview** | High-level recovery and payment intelligence, including revenue at risk and case activity. |
| **Recovery Cases** | Detailed view of payment cases, attempts, failures, recovery decisions, and timelines. |
| **AI Decisions** | AI recommendations, confidence, reasoning, and final decisions. |
| **Audit Trail** | Historical recovery decision information for traceability. |
| **Evaluation** | AI versus deterministic baseline evaluation results. |
| **Test Payment** | A controlled interface for creating Razorpay Test Mode orders and testing payment flows. |

---

## Recovery Lifecycle

RIDE models recovery processing using explicit states:

```
AT_RISK
   ↓
ANALYZING
   ↓
RECOMMENDED
   ↓
APPROVED
   ↓
ACTIONED
   ↓
RECOVERED / ESCALATED / STOPPED
```

This makes the recovery process explicit and easier to monitor and audit.

---

## Architecture

```
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
```

---

## Technology Stack

**Frontend**
- React.js
- JavaScript
- Vite
- CSS
- React Router
- Lucide React

**Backend**
- Java
- Spring Boot
- Spring Data JPA
- REST APIs
- PostgreSQL

**AI & Evaluation**
- Python
- Pandas
- Scikit-learn
- Gemini API
- Synthetic Dataset
- Held-Out Evaluation

**Payment Integration**
- Razorpay Test Mode
- Razorpay Orders
- Razorpay Checkout
- Razorpay Webhooks
- Webhook Signature Verification

---

## Getting Started

### Prerequisites

Make sure the following are installed:

- Java 17+
- Maven (or use the included Maven wrapper)
- Node.js and npm
- PostgreSQL
- Python 3.x
- Razorpay Test Mode account
- Gemini API access

### 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd RIDE
```

### 2. Start PostgreSQL

If using Docker:

```bash
docker-compose up -d
```

Make sure PostgreSQL is running before starting the backend.

### 3. Start the Backend

```bash
cd backend
```

Windows:

```bash
mvnw.cmd spring-boot:run
```

Linux / macOS:

```bash
./mvnw spring-boot:run
```

The backend runs on `http://localhost:8081`

### 4. Start the Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`

---

## Environment Configuration

Configure the required credentials and database settings for your local environment.

```env
# Razorpay Test Mode
RAZORPAY_KEY_ID=

# Razorpay webhook secret
RAZORPAY_WEBHOOK_SECRET=

# Gemini API
GEMINI_API_KEY=

# PostgreSQL
DB_URL=
DB_USERNAME=
DB_PASSWORD=
```

> Use Test Mode credentials only for the project demonstration.
> **Do not commit API keys, webhook secrets, database passwords, or other credentials to GitHub.**

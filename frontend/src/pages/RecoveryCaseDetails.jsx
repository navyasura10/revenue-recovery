import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import {
    ArrowLeft,
    RefreshCw,
    AlertTriangle,
    CheckCircle2,
    Clock3,
    ShieldCheck,
    Brain,
} from "lucide-react";

const API_BASE_URL = "http://localhost:8081";

function RecoveryCaseDetails() {

    const { paymentId } = useParams();
    const navigate = useNavigate();

    const [payment, setPayment] = useState(null);
    const [attempts, setAttempts] = useState([]);
    const [decisions, setDecisions] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    // =========================================================
    // LOAD CASE DATA
    // =========================================================

    const loadData = async () => {

        try {

            setLoading(true);
            setError("");

            const [
                paymentsResponse,
                attemptsResponse,
                decisionsResponse,
            ] = await Promise.all([

                axios.get(
                    `${API_BASE_URL}/api/payments`
                ),

                axios.get(
                    `${API_BASE_URL}/api/payment-attempts`
                ),

                axios.get(
                    `${API_BASE_URL}/api/recovery-decisions`
                ),

            ]);

            const payments =
                Array.isArray(paymentsResponse.data)
                    ? paymentsResponse.data
                    : [];

            const allAttempts =
                Array.isArray(attemptsResponse.data)
                    ? attemptsResponse.data
                    : [];

            const allDecisions =
                Array.isArray(decisionsResponse.data)
                    ? decisionsResponse.data
                    : [];

            console.log(
                "Recovery Case - Payments:",
                payments
            );

            console.log(
                "Recovery Case - Attempts:",
                allAttempts
            );

            console.log(
                "Recovery Case - Decisions:",
                allDecisions
            );


            // =================================================
            // FIND SELECTED PAYMENT
            // =================================================

            const selectedPayment =
                payments.find(
                    item =>
                        String(
                            item.paymentId ||
                            item.payment_id ||
                            ""
                        ) === String(paymentId)
                );

            if (!selectedPayment) {

                setPayment(null);
                setAttempts([]);
                setDecisions([]);

                setError(
                    "Payment case was not found."
                );

                return;
            }


            // =================================================
            // NORMALIZE PAYMENT VALUES
            // =================================================

            const selectedPaymentId =
                selectedPayment.paymentId ||
                selectedPayment.payment_id;

            const selectedOrderId =
                selectedPayment.orderId ||
                selectedPayment.order_id;


            // =================================================
            // GET ALL ATTEMPTS FOR SAME ORDER
            // =================================================

            const orderAttempts =
                allAttempts
                    .filter(attempt => {

                        const attemptOrderId =
                            attempt.orderId ||
                            attempt.order_id;

                        return String(attemptOrderId || "") ===
                            String(selectedOrderId || "");

                    })
                    .sort(
                        (a, b) =>
                            getTimestamp(a) -
                            getTimestamp(b)
                    );


            // =================================================
            // SELECTED PAYMENT TIMESTAMP
            // =================================================

            const selectedTimestamp =
                getTimestamp(selectedPayment);


            // =================================================
            // SHOW HISTORY UP TO SELECTED PAYMENT
            // =================================================

            let historyAttempts =
                orderAttempts.filter(attempt => {

                    const attemptTimestamp =
                        getTimestamp(attempt);

                    /*
                     * If either timestamp is unavailable,
                     * don't accidentally remove the attempt.
                     */

                    if (
                        !selectedTimestamp ||
                        !attemptTimestamp
                    ) {
                        return true;
                    }

                    return (
                        attemptTimestamp <=
                        selectedTimestamp
                    );

                });


            // =================================================
            // ENSURE SELECTED PAYMENT ATTEMPT IS INCLUDED
            // =================================================

            const selectedFailedAttempt =
                orderAttempts.find(attempt => {

                    const attemptPaymentId =
                        attempt.paymentId ||
                        attempt.payment_id;

                    return String(
                        attemptPaymentId || ""
                    ) === String(
                        selectedPaymentId || ""
                    );

                });


            if (
                selectedFailedAttempt &&
                !historyAttempts.some(attempt => {

                    const attemptPaymentId =
                        attempt.paymentId ||
                        attempt.payment_id;

                    return String(
                        attemptPaymentId || ""
                    ) === String(
                        selectedPaymentId || ""
                    );

                })
            ) {

                historyAttempts = [
                    ...historyAttempts,
                    selectedFailedAttempt,
                ];

            }


            // =================================================
            // SUCCESSFUL PAYMENT
            // =================================================

            const selectedIsCaptured =
                selectedPayment.status === "captured" ||
                selectedPayment.status === "recovered" ||
                selectedPayment.captured === true;


            if (selectedIsCaptured) {

                const alreadyExists =
                    historyAttempts.some(attempt => {

                        const attemptPaymentId =
                            attempt.paymentId ||
                            attempt.payment_id;

                        return String(
                            attemptPaymentId || ""
                        ) === String(
                            selectedPaymentId || ""
                        );

                    });


                if (!alreadyExists) {

                    historyAttempts.push({

                        paymentId:
                            selectedPaymentId,

                        orderId:
                            selectedOrderId,

                        amount:
                            selectedPayment.amount,

                        currency:
                            selectedPayment.currency,

                        status:
                            "captured",

                        method:
                            selectedPayment.method,

                        failureCategory:
                            null,

                        failureCode:
                            null,

                        failureReason:
                            null,

                        occurredAt:
                            selectedPayment.createdAt ||
                            selectedPayment.updatedAt,

                        attemptNumber:
                            null,

                        isSyntheticCapturedAttempt:
                            true,

                    });

                }

            }


            // =================================================
            // SORT ATTEMPTS
            // =================================================

            historyAttempts.sort(
                (a, b) =>
                    getTimestamp(a) -
                    getTimestamp(b)
            );


            // =========================================================
            // AI RECOVERY DECISIONS
            //
            // IMPORTANT:
            //
            // We match by:
            //
            // 1. paymentId
            // 2. orderId
            //
            // We DO NOT require the decision timestamp to be
            // before the payment timestamp.
            //
            // The AI decision normally happens AFTER the payment
            // failure, so the previous timestamp filter could
            // incorrectly hide the decision.
            // =========================================================

            const orderDecisions =
                allDecisions
                    .filter(decision => {

                        const decisionOrderId =
                            decision.orderId ||
                            decision.order_id;

                        const decisionPaymentId =
                            decision.paymentId ||
                            decision.payment_id;

                        const matchesOrder =
                            decisionOrderId &&
                            selectedOrderId &&
                            String(decisionOrderId) ===
                            String(selectedOrderId);

                        const matchesPayment =
                            decisionPaymentId &&
                            selectedPaymentId &&
                            String(decisionPaymentId) ===
                            String(selectedPaymentId);

                        return (
                            matchesOrder ||
                            matchesPayment
                        );

                    })
                    .sort(
                        (a, b) =>
                            getTimestamp(b) -
                            getTimestamp(a)
                    );


            // =================================================
            // DEBUG AI DECISIONS
            // =================================================

            console.log(
                "Selected Payment ID:",
                selectedPaymentId
            );

            console.log(
                "Selected Order ID:",
                selectedOrderId
            );

            console.log(
                "Matching AI Decisions:",
                orderDecisions
            );


            // =================================================
            // SET STATE
            // =================================================

            setPayment(selectedPayment);

            setAttempts(historyAttempts);

            setDecisions(orderDecisions);

        } catch (err) {

            console.error(
                "Recovery case loading error:",
                err
            );

            setError(
                "Unable to load this recovery case."
            );

        } finally {

            setLoading(false);

        }

    };


    useEffect(() => {

        loadData();

    }, [paymentId]);


    // =========================================================
    // HELPERS
    // =========================================================

    function getTimestamp(item) {

        if (!item) {
            return 0;
        }

        const value =
            item.occurredAt ||
            item.occurred_at ||
            item.createdAt ||
            item.created_at ||
            item.updatedAt ||
            item.updated_at;

        if (!value) {
            return 0;
        }

        const timestamp =
            new Date(value).getTime();

        return Number.isNaN(timestamp)
            ? 0
            : timestamp;

    }


    const formatAmount = (amount) => {

        if (amount == null) {
            return "₹0";
        }

        return new Intl.NumberFormat(
            "en-IN",
            {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
            }
        ).format(amount / 100);

    };


    const formatDate = (value) => {

        if (!value) {
            return "—";
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return value;
        }

        return date.toLocaleString(
            "en-IN"
        );

    };


    const getStatusClass = (status) => {

        if (
            status === "captured" ||
            status === "recovered" ||
            status === "success"
        ) {
            return "status-success";
        }

        if (status === "failed") {
            return "status-danger";
        }

        if (status === "authorized") {
            return "status-warning";
        }

        return "status-neutral";

    };


    // =========================================================
    // NUMBER ATTEMPTS
    // =========================================================

    const numberedAttempts = useMemo(() => {

        return attempts.map(
            (attempt, index) => ({

                ...attempt,

                displayAttemptNumber:
                    index + 1,

            })
        );

    }, [attempts]);


    // =========================================================
    // LATEST ATTEMPT
    // =========================================================

    const latestAttempt =
        numberedAttempts.length > 0
            ? numberedAttempts[
            numberedAttempts.length - 1
            ]
            : null;


    // =========================================================
    // LATEST FAILED ATTEMPT
    // =========================================================

    const latestFailedAttempt =
        [...numberedAttempts]
            .reverse()
            .find(
                attempt =>
                    attempt.status === "failed"
            ) || null;


    // =========================================================
    // SELECTED PAYMENT SUCCESS?
    // =========================================================

    const isRecovered =
        payment &&
        (
            payment.status === "captured" ||
            payment.status === "recovered" ||
            payment.captured === true
        );


    // =========================================================
    // ORDER AMOUNT
    // =========================================================

    const orderAmount =
        payment?.amount || 0;


    // =========================================================
    // REVENUE AT RISK
    // =========================================================

    const revenueAtRisk =
        isRecovered
            ? 0
            : orderAmount;


    // =========================================================
    // RECOVERED REVENUE
    // =========================================================

    const recoveredRevenue =
        isRecovered
            ? orderAmount
            : 0;


    // =========================================================
    // LATEST DECISION
    // =========================================================

    const latestDecision =
        decisions.length > 0
            ? decisions[0]
            : null;


    // =========================================================
    // AI VALUE HELPERS
    //
    // Supports both camelCase and snake_case so the UI
    // continues working even if backend DTO names differ.
    // =========================================================

    const getDecisionAction = (decision) => {

        if (!decision) {
            return null;
        }

        return (
            decision.action ||
            decision.finalAction ||
            decision.final_action ||
            decision.recoveryAction ||
            decision.recovery_action ||
            decision.approvedAction ||
            decision.approved_action ||
            decision.aiRecommendedAction ||
            decision.ai_recommended_action ||
            decision.recommendedAction ||
            decision.recommended_action ||
            decision.geminiAction ||
            decision.gemini_action ||
            null
        );

    };


    const getAIRecommendedAction = (decision) => {

        if (!decision) {
            return null;
        }

        return (
            decision.aiRecommendedAction ||
            decision.ai_recommended_action ||
            decision.geminiAction ||
            decision.gemini_action ||
            decision.recommendedAction ||
            decision.recommended_action ||
            decision.action ||
            null
        );

    };


    const getAIConfidence = (decision) => {

        if (!decision) {
            return null;
        }

        const value =
            decision.aiConfidence ??
            decision.ai_confidence ??
            decision.geminiConfidence ??
            decision.gemini_confidence ??
            decision.confidence ??
            null;

        if (value == null) {
            return null;
        }

        const numericValue =
            Number(value);

        if (Number.isNaN(numericValue)) {
            return null;
        }

        /*
         * Backend may return:
         *
         * 0.85
         *
         * or
         *
         * 85
         *
         * Normalize both.
         */

        return numericValue > 1
            ? numericValue / 100
            : numericValue;

    };


    const getAIReason = (decision) => {

        if (!decision) {
            return null;
        }

        return (
            decision.aiReason ||
            decision.ai_reason ||
            decision.geminiReason ||
            decision.gemini_reason ||
            decision.reason ||
            decision.explanation ||
            decision.aiExplanation ||
            decision.ai_explanation ||
            null
        );

    };


    const getAIOverridden = (decision) => {

        if (!decision) {
            return false;
        }

        return Boolean(
            decision.aiOverridden ??
            decision.ai_overridden ??
            decision.overridden ??
            false
        );

    };


    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {

        return (

            <div className="page recovery-details-page">

                <div className="details-loading">

                    <RefreshCw
                        size={20}
                        className="spin"
                    />

                    <span>
                        Loading recovery case...
                    </span>

                </div>

            </div>

        );

    }


    // =========================================================
    // ERROR
    // =========================================================

    if (error || !payment) {

        return (

            <div className="page recovery-details-page">

                <div className="details-header">

                    <button
                        className="back-button"
                        onClick={() =>
                            navigate(
                                "/recovery-cases"
                            )
                        }
                    >

                        <ArrowLeft size={16} />

                        Back to Recovery Cases

                    </button>

                </div>

                <div className="details-error">

                    <AlertTriangle
                        size={22}
                    />

                    <div>

                        <h3>
                            Unable to load case
                        </h3>

                        <p>
                            {error ||
                                "Recovery case not found."}
                        </p>

                    </div>

                </div>

            </div>

        );

    }


    // =========================================================
    // MAIN UI
    // =========================================================

    return (

        <div className="page recovery-details-page">


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="details-header">

                <div>

                    <button
                        className="back-button"
                        onClick={() =>
                            navigate(
                                "/recovery-cases"
                            )
                        }
                    >

                        <ArrowLeft size={16} />

                        Back to Recovery Cases

                    </button>

                    <div className="details-title">

                        <div>

                            <h1>
                                Recovery Case
                            </h1>

                            <p>
                                Order:{" "}
                                {payment.orderId ||
                                    payment.order_id ||
                                    "—"}
                            </p>

                        </div>

                        <span
                            className={`status-badge ${getStatusClass(
                                isRecovered
                                    ? "captured"
                                    : payment.status
                            )}`}
                        >

                            {isRecovered
                                ? "captured"
                                : payment.status ||
                                "unknown"}

                        </span>

                    </div>

                </div>

                <button
                    className="refresh-button"
                    onClick={loadData}
                    disabled={loading}
                >

                    <RefreshCw
                        size={15}
                        className={
                            loading
                                ? "spin"
                                : ""
                        }
                    />

                    Refresh

                </button>

            </div>


            {/* =================================================
                ORDER KPI CARDS
            ================================================= */}

            <div className="details-kpi-grid">

                <div className="details-kpi-card">

                    <span>
                        Order Amount
                    </span>

                    <strong>
                        {formatAmount(
                            orderAmount
                        )}
                    </strong>

                </div>


                <div className="details-kpi-card">

                    <span>
                        Revenue at Risk
                    </span>

                    <strong>
                        {formatAmount(
                            revenueAtRisk
                        )}
                    </strong>

                </div>


                <div className="details-kpi-card">

                    <span>
                        Recovered Revenue
                    </span>

                    <strong>
                        {formatAmount(
                            recoveredRevenue
                        )}
                    </strong>

                </div>


                <div className="details-kpi-card">

                    <span>
                        Total Attempts
                    </span>

                    <strong>
                        {numberedAttempts.length}
                    </strong>

                </div>

            </div>


            {/* =================================================
                PAYMENT INFORMATION
            ================================================= */}

            <div className="details-grid">

                <section className="details-card">

                    <div className="details-card-header">

                        <div>

                            <h2>
                                Payment Information
                            </h2>

                            <p>
                                Selected Razorpay
                                payment
                            </p>

                        </div>

                        {isRecovered ? (

                            <CheckCircle2
                                size={19}
                            />

                        ) : (

                            <AlertTriangle
                                size={19}
                            />

                        )}

                    </div>


                    <div className="details-info-grid">

                        <div>

                            <span>
                                Payment ID
                            </span>

                            <strong>
                                {
                                    payment.paymentId ||
                                    payment.payment_id ||
                                    "—"
                                }
                            </strong>

                        </div>


                        <div>

                            <span>
                                Order ID
                            </span>

                            <strong>
                                {
                                    payment.orderId ||
                                    payment.order_id ||
                                    "—"
                                }
                            </strong>

                        </div>


                        <div>

                            <span>
                                Amount
                            </span>

                            <strong>
                                {formatAmount(
                                    payment.amount
                                )}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Currency
                            </span>

                            <strong>
                                {payment.currency ||
                                    "—"}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Payment Method
                            </span>

                            <strong>
                                {
                                    payment.method ||
                                    payment.paymentMethod ||
                                    payment.payment_method ||
                                    "—"
                                }
                            </strong>

                        </div>


                        <div>

                            <span>
                                Captured
                            </span>

                            <strong>
                                {payment.captured
                                    ? "Yes"
                                    : "No"}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Razorpay Attempts
                            </span>

                            <strong>
                                {payment.attempts ||
                                    0}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Last Updated
                            </span>

                            <strong>
                                {formatDate(
                                    payment.updatedAt ||
                                    payment.updated_at
                                )}
                            </strong>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    FAILURE ANALYSIS
                ================================================= */}

                <section className="details-card">

                    <div className="details-card-header">

                        <div>

                            <h2>
                                {isRecovered
                                    ? "Recovery Outcome"
                                    : "Failure Analysis"}
                            </h2>

                            <p>
                                {isRecovered
                                    ? "Final successful payment for this order"
                                    : "Latest failed payment attempt"}
                            </p>

                        </div>

                        {isRecovered ? (

                            <CheckCircle2
                                size={19}
                            />

                        ) : (

                            <AlertTriangle
                                size={19}
                            />

                        )}

                    </div>


                    {isRecovered ? (

                        <div className="failure-analysis">

                            <div className="failure-main">

                                <span>
                                    Recovery Status
                                </span>

                                <strong>
                                    PAYMENT RECOVERED
                                </strong>

                            </div>


                            <div className="details-info-grid">

                                <div>

                                    <span>
                                        Successful Attempt
                                    </span>

                                    <strong>
                                        #
                                        {
                                            numberedAttempts.length
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Payment Status
                                    </span>

                                    <strong>
                                        captured
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Payment ID
                                    </span>

                                    <strong>
                                        {
                                            payment.paymentId ||
                                            payment.payment_id ||
                                            "—"
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Recovered Amount
                                    </span>

                                    <strong>
                                        {formatAmount(
                                            payment.amount
                                        )}
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Payment Method
                                    </span>

                                    <strong>
                                        {
                                            payment.method ||
                                            payment.paymentMethod ||
                                            payment.payment_method ||
                                            "—"
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Recovered At
                                    </span>

                                    <strong>
                                        {formatDate(
                                            payment.updatedAt ||
                                            payment.updated_at ||
                                            payment.createdAt ||
                                            payment.created_at
                                        )}
                                    </strong>

                                </div>

                            </div>

                        </div>

                    ) : latestFailedAttempt ? (

                        <div className="failure-analysis">

                            <div className="failure-main">

                                <span>
                                    Failure Category
                                </span>

                                <strong>
                                    {
                                        latestFailedAttempt.failureCategory ||
                                        latestFailedAttempt.failure_category ||
                                        "UNKNOWN"
                                    }
                                </strong>

                            </div>


                            <div className="details-info-grid">

                                <div>

                                    <span>
                                        Attempt
                                    </span>

                                    <strong>
                                        #
                                        {
                                            latestFailedAttempt.displayAttemptNumber
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Status
                                    </span>

                                    <strong>
                                        {
                                            latestFailedAttempt.status ||
                                            "—"
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Payment ID
                                    </span>

                                    <strong>
                                        {
                                            latestFailedAttempt.paymentId ||
                                            latestFailedAttempt.payment_id ||
                                            "—"
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Failure Code
                                    </span>

                                    <strong>
                                        {
                                            latestFailedAttempt.failureCode ||
                                            latestFailedAttempt.failure_code ||
                                            "—"
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Failure Reason
                                    </span>

                                    <strong>
                                        {
                                            latestFailedAttempt.failureReason ||
                                            latestFailedAttempt.failure_reason ||
                                            "—"
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Payment Method
                                    </span>

                                    <strong>
                                        {
                                            latestFailedAttempt.method ||
                                            latestFailedAttempt.paymentMethod ||
                                            latestFailedAttempt.payment_method ||
                                            "—"
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Occurred At
                                    </span>

                                    <strong>
                                        {formatDate(
                                            latestFailedAttempt.occurredAt ||
                                            latestFailedAttempt.occurred_at ||
                                            latestFailedAttempt.createdAt ||
                                            latestFailedAttempt.created_at
                                        )}
                                    </strong>

                                </div>

                            </div>

                        </div>

                    ) : (

                        <div className="empty-details">

                            <Clock3
                                size={20}
                            />

                            <span>
                                No failed payment
                                attempts recorded.
                            </span>

                        </div>

                    )}

                </section>

            </div>


            {/* =================================================
                AI DECISION
            ================================================= */}

            <section className="details-card ai-decision-card">

                <div className="details-card-header">

                    <div>

                        <h2>
                            AI Recovery Decision
                        </h2>

                        <p>
                            RIDE's AI recommendations
                            for this order
                        </p>

                    </div>

                    <Brain
                        size={20}
                    />

                </div>


                {latestDecision ? (

                    <div className="ai-decision-content">


                        <div className="ai-decision-main">


                            <div>

                                <span>
                                    Final Decision
                                </span>

                                <strong>
                                    {
                                        getDecisionAction(
                                            latestDecision
                                        ) || "—"
                                    }
                                </strong>

                            </div>


                            <div>

                                <span>
                                    AI Recommendation
                                </span>

                                <strong>
                                    {
                                        getAIRecommendedAction(
                                            latestDecision
                                        ) || "—"
                                    }
                                </strong>

                            </div>


                            <div>

                                <span>
                                    AI Confidence
                                </span>

                                <strong>

                                    {getAIConfidence(
                                        latestDecision
                                    ) != null

                                        ? `${(
                                            getAIConfidence(
                                                latestDecision
                                            ) * 100
                                        ).toFixed(0)}%`

                                        : "—"}

                                </strong>

                            </div>


                        </div>


                        <div className="decision-reason">

                            <span>
                                AI Reason
                            </span>

                            <p>
                                {
                                    getAIReason(
                                        latestDecision
                                    ) ||
                                    "No explanation recorded."
                                }
                            </p>

                        </div>


                        <div className="decision-meta">


                            <div>

                                <span>
                                    AI Overridden
                                </span>

                                <strong>
                                    {
                                        getAIOverridden(
                                            latestDecision
                                        )
                                            ? "Yes"
                                            : "No"
                                    }
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Created
                                </span>

                                <strong>
                                    {formatDate(
                                        latestDecision.createdAt ||
                                        latestDecision.created_at ||
                                        latestDecision.updatedAt ||
                                        latestDecision.updated_at
                                    )}
                                </strong>

                            </div>


                        </div>

                    </div>

                ) : (

                    <div className="empty-details">

                        <Brain
                            size={20}
                        />

                        <span>
                            No recovery decision
                            recorded for this order.
                        </span>

                    </div>

                )}

            </section>


            {/* =================================================
                PAYMENT ATTEMPT TIMELINE
            ================================================= */}

            <section className="details-card">

                <div className="details-card-header">

                    <div>

                        <h2>
                            Payment Attempts
                        </h2>

                        <p>
                            Complete payment history
                            up to this payment
                        </p>

                    </div>

                    <Clock3
                        size={19}
                    />

                </div>


                {numberedAttempts.length > 0 ? (

                    <div className="attempt-timeline">

                        {numberedAttempts.map(
                            (attempt) => {

                                const isSuccessful =
                                    attempt.status ===
                                    "captured" ||
                                    attempt.status ===
                                    "success";


                                return (

                                    <div
                                        className="attempt-item"
                                        key={
                                            `${attempt.paymentId || attempt.payment_id}-${attempt.displayAttemptNumber}`
                                        }
                                    >

                                        <div className="attempt-marker">

                                            {isSuccessful ? (

                                                <CheckCircle2
                                                    size={15}
                                                />

                                            ) : (

                                                <AlertTriangle
                                                    size={15}
                                                />

                                            )}

                                        </div>


                                        <div className="attempt-content">

                                            <div className="attempt-top">

                                                <strong>

                                                    Attempt #
                                                    {
                                                        attempt.displayAttemptNumber
                                                    }

                                                </strong>

                                                <span
                                                    className={`status-badge ${getStatusClass(
                                                        attempt.status
                                                    )}`}
                                                >

                                                    {
                                                        attempt.status ||
                                                        "unknown"
                                                    }

                                                </span>

                                            </div>


                                            <div className="attempt-details">

                                                <span>
                                                    Payment:{" "}
                                                    {
                                                        attempt.paymentId ||
                                                        attempt.payment_id ||
                                                        "—"
                                                    }
                                                </span>

                                                <span>
                                                    Amount:{" "}
                                                    {
                                                        formatAmount(
                                                            attempt.amount
                                                        )
                                                    }
                                                </span>

                                                <span>
                                                    Method:{" "}
                                                    {
                                                        attempt.method ||
                                                        attempt.paymentMethod ||
                                                        attempt.payment_method ||
                                                        "—"
                                                    }
                                                </span>

                                                <span>
                                                    Category:{" "}

                                                    {
                                                        attempt.failureCategory ||
                                                        attempt.failure_category ||
                                                        (
                                                            isSuccessful
                                                                ? "RECOVERED"
                                                                : "—"
                                                        )
                                                    }

                                                </span>

                                                <span>
                                                    {
                                                        formatDate(
                                                            attempt.occurredAt ||
                                                            attempt.occurred_at ||
                                                            attempt.createdAt ||
                                                            attempt.created_at
                                                        )
                                                    }
                                                </span>

                                            </div>

                                        </div>

                                    </div>

                                );

                            }
                        )}

                    </div>

                ) : (

                    <div className="empty-details">

                        No attempts recorded.

                    </div>

                )}

            </section>


            {/* =================================================
                POLICY / SAFETY
            ================================================= */}

            <section className="details-card policy-card">

                <div className="details-card-header">

                    <div>

                        <h2>
                            Policy & Safety
                        </h2>

                        <p>
                            Deterministic controls applied
                            after AI recommendation
                        </p>

                    </div>

                    <ShieldCheck
                        size={20}
                    />

                </div>


                <div className="policy-items">

                    <div>

                        <CheckCircle2
                            size={16}
                        />

                        <span>
                            AI recommendation is
                            validated by deterministic
                            policy rules.
                        </span>

                    </div>


                    <div>

                        <CheckCircle2
                            size={16}
                        />

                        <span>
                            Recovery decisions are
                            recorded in the audit trail.
                        </span>

                    </div>


                    <div>

                        <CheckCircle2
                            size={16}
                        />

                        <span>
                            High-risk decisions can be
                            routed for human review.
                        </span>

                    </div>

                </div>

            </section>

        </div>

    );

}

export default RecoveryCaseDetails;
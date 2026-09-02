import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    RefreshCw,
    TrendingUp,
    Target,
    IndianRupee,
    Brain,
    ShieldCheck,
    AlertTriangle,
} from "lucide-react";

const API_BASE_URL = "http://localhost:8081";

function Evaluation() {

    const [results, setResults] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // =========================================================
    // LOAD EVALUATION DATA
    // =========================================================

    const loadEvaluation = async () => {

        try {

            setLoading(true);
            setError("");

            const response =
                await axios.get(
                    `${API_BASE_URL}/api/evaluation`
                );

            console.log(
                "Evaluation API:",
                response.data
            );

            setResults(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );

        } catch (err) {

            console.error(
                "Evaluation loading error:",
                err
            );

            setResults([]);

            setError(
                "Evaluation data could not be loaded from the backend."
            );

        } finally {

            setLoading(false);
        }
    };

    useEffect(() => {
        loadEvaluation();
    }, []);

    // =========================================================
    // METRICS
    // =========================================================

    const metrics = useMemo(() => {

        if (!results.length) {

            return {
                testCases: 0,
                revenueAtRisk: 0,
                recoveredRevenue: 0,
                recoveryRate: 0,
                baselineAgreement: 0,
                geminiAgreement: 0,
                averageConfidence: 0,
            };
        }

        let revenueAtRisk = 0;
        let recoveredRevenue = 0;

        let baselineMatches = 0;
        let geminiMatches = 0;

        let confidenceTotal = 0;
        let confidenceCount = 0;

        results.forEach((item) => {

            const amount =
                Number(item.amount) || 0;

            const recovered =
                Number(item.recovered_amount) || 0;

            revenueAtRisk += amount;
            recoveredRevenue += recovered;

            // -------------------------------------------------
            // BASELINE
            // -------------------------------------------------

            const baseline =
                normalizeAction(
                    item.baseline_action
                );

            // -------------------------------------------------
            // GEMINI
            // -------------------------------------------------

            const gemini =
                normalizeAction(
                    item.gemini_action
                );

            // -------------------------------------------------
            // ACTUAL OUTCOME
            // -------------------------------------------------

            const outcome =
                normalizeOutcome(
                    item.actual_outcome
                );

            /*
             * Evaluation dataset doesn't have a separate
             * "target action" column.
             *
             * Therefore we compare each model's action
             * with the observed outcome.
             */

            if (
                baseline &&
                outcome &&
                actionsMatchOutcome(
                    baseline,
                    outcome
                )
            ) {
                baselineMatches++;
            }

            if (
                gemini &&
                outcome &&
                actionsMatchOutcome(
                    gemini,
                    outcome
                )
            ) {
                geminiMatches++;
            }

            const confidence =
                Number(
                    item.gemini_confidence
                );

            if (
                !Number.isNaN(confidence)
                && confidence > 0
            ) {

                confidenceTotal += confidence;
                confidenceCount++;
            }
        });

        const recoveryRate =
            revenueAtRisk > 0
                ? (
                    recoveredRevenue /
                    revenueAtRisk
                ) * 100
                : 0;

        return {

            testCases:
                results.length,

            revenueAtRisk,

            recoveredRevenue,

            recoveryRate,

            baselineAgreement:
                (
                    baselineMatches /
                    results.length
                ) * 100,

            geminiAgreement:
                (
                    geminiMatches /
                    results.length
                ) * 100,

            averageConfidence:
                confidenceCount > 0
                    ? (
                        confidenceTotal /
                        confidenceCount
                    ) * 100
                    : 0,
        };

    }, [results]);

    // =========================================================
    // FORMATTERS
    // =========================================================

    const formatAmount = (amount) => {

        return new Intl.NumberFormat(
            "en-IN",
            {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
            }
        ).format(
            (Number(amount) || 0) / 100
        );
    };

    const formatPercent = (value) => {

        return `${Number(value || 0).toFixed(1)}%`;
    };

    const formatAction = (action) => {

        if (!action) {
            return "—";
        }

        return String(action)
            .replaceAll("_", " ")
            .toLowerCase()
            .replace(
                /\b\w/g,
                (letter) =>
                    letter.toUpperCase()
            );
    };

    // =========================================================
    // ACTION CLASS
    // =========================================================

    const getActionClass = (action) => {

        switch (
        normalizeAction(action)
        ) {

            case "CONTROLLED_RETRY":
                return "evaluation-action-retry";

            case "RETRY_LATER":
                return "evaluation-action-later";

            case "CUSTOMER_ACTION":
                return "evaluation-action-customer";

            case "DO_NOT_RETRY":
                return "evaluation-action-stop";

            case "HUMAN_REVIEW":
                return "evaluation-action-human";

            default:
                return "evaluation-action-neutral";
        }
    };

    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {

        return (
            <div className="page">

                <div className="table-state">

                    <RefreshCw
                        size={20}
                        className="spin"
                    />

                    <span>
                        Loading evaluation results...
                    </span>

                </div>

            </div>
        );
    }

    // =========================================================
    // UI
    // =========================================================

    return (

        <div className="page">

            {/* HEADER */}

            <div className="page-heading">

                <div>

                    <h1>
                        Evaluation
                    </h1>

                    <p>
                        Measure RIDE's AI decision
                        quality against the
                        deterministic recovery
                        baseline.
                    </p>

                </div>

                <button
                    className="refresh-button"
                    onClick={loadEvaluation}
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

            {/* ERROR */}

            {error && (

                <div className="error-banner">

                    <AlertTriangle
                        size={17}
                    />

                    <span>
                        {error}
                    </span>

                </div>
            )}

            {/* KPI CARDS */}

            <div className="evaluation-summary">

                <div className="evaluation-card">

                    <div className="evaluation-card-icon">
                        <Target size={19} />
                    </div>

                    <div>

                        <span>
                            Test Cases
                        </span>

                        <strong>
                            {metrics.testCases}
                        </strong>

                        <small>
                            Held-out evaluation records
                        </small>

                    </div>

                </div>


                <div className="evaluation-card">

                    <div className="evaluation-card-icon">
                        <IndianRupee size={19} />
                    </div>

                    <div>

                        <span>
                            Revenue at Risk
                        </span>

                        <strong>
                            {formatAmount(
                                metrics.revenueAtRisk
                            )}
                        </strong>

                        <small>
                            Total evaluated value
                        </small>

                    </div>

                </div>


                <div className="evaluation-card">

                    <div className="evaluation-card-icon">
                        <TrendingUp size={19} />
                    </div>

                    <div>

                        <span>
                            Recovered Revenue
                        </span>

                        <strong>
                            {formatAmount(
                                metrics.recoveredRevenue
                            )}
                        </strong>

                        <small>
                            Actual recovery outcome
                        </small>

                    </div>

                </div>


                <div className="evaluation-card">

                    <div className="evaluation-card-icon">
                        <ShieldCheck size={19} />
                    </div>

                    <div>

                        <span>
                            Recovery Rate
                        </span>

                        <strong>
                            {formatPercent(
                                metrics.recoveryRate
                            )}
                        </strong>

                        <small>
                            Recovered / evaluated value
                        </small>

                    </div>

                </div>

            </div>


            {/* DECISION INTELLIGENCE */}

            <div className="evaluation-comparison">

                <div className="evaluation-section-header">

                    <div>

                        <h2>
                            Decision Intelligence
                        </h2>

                        <p>
                            Comparison between the
                            deterministic baseline
                            and Gemini AI.
                        </p>

                    </div>

                </div>


                <div className="comparison-grid">

                    {/* BASELINE */}

                    <div className="comparison-card">

                        <div className="comparison-title">

                            <div className="comparison-icon">
                                <ShieldCheck
                                    size={18}
                                />
                            </div>

                            <div>

                                <h3>
                                    Deterministic Baseline
                                </h3>

                                <span>
                                    Rule-based recovery engine
                                </span>

                            </div>

                        </div>

                        <div className="comparison-value">

                            {formatPercent(
                                metrics.baselineAgreement
                            )}

                        </div>

                        <div className="comparison-label">

                            Agreement with observed outcome

                        </div>

                    </div>


                    {/* GEMINI */}

                    <div className="comparison-card ai">

                        <div className="comparison-title">

                            <div className="comparison-icon">
                                <Brain
                                    size={18}
                                />
                            </div>

                            <div>

                                <h3>
                                    Gemini AI
                                </h3>

                                <span>
                                    AI-assisted decision engine
                                </span>

                            </div>

                        </div>

                        <div className="comparison-value">

                            {formatPercent(
                                metrics.geminiAgreement
                            )}

                        </div>

                        <div className="comparison-label">

                            Agreement with observed outcome

                        </div>

                        <div className="comparison-confidence">

                            Average AI confidence:{" "}

                            <strong>
                                {formatPercent(
                                    metrics.averageConfidence
                                )}
                            </strong>

                        </div>

                    </div>

                </div>

            </div>


            {/* EVALUATION CASES */}

            <div className="evaluation-results">

                <div className="evaluation-section-header">

                    <div>

                        <h2>
                            Evaluation Cases
                        </h2>

                        <p>
                            Case-level comparison between
                            the deterministic baseline,
                            Gemini AI, and observed outcome.
                        </p>

                    </div>

                </div>


                <div className="evaluation-table-container">

                    {results.length === 0 ? (

                        <div className="table-state">

                            <h3>
                                No evaluation data available
                            </h3>

                            <p>
                                Make sure
                                gemini_vs_baseline_results.csv
                                exists in
                                backend/ai/data/.
                            </p>

                        </div>

                    ) : (

                        <table className="evaluation-table">

                            <thead>

                                <tr>

                                    <th>
                                        Case
                                    </th>

                                    <th>
                                        Failure
                                    </th>

                                    <th>
                                        Amount
                                    </th>

                                    <th>
                                        Baseline
                                    </th>

                                    <th>
                                        Gemini AI
                                    </th>

                                    <th>
                                        Confidence
                                    </th>

                                    <th>
                                        Outcome
                                    </th>

                                    <th>
                                        Recovered
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {results.map(
                                    (item, index) => {

                                        const paymentId =
                                            item.payment_id ||
                                            `Case ${index + 1}`;

                                        const category =
                                            item.failure_category;

                                        const baseline =
                                            item.baseline_action;

                                        const gemini =
                                            item.gemini_action;

                                        const outcome =
                                            item.actual_outcome;

                                        const amount =
                                            Number(
                                                item.amount
                                            ) || 0;

                                        const recovered =
                                            Number(
                                                item.recovered_amount
                                            ) || 0;

                                        const confidence =
                                            Number(
                                                item.gemini_confidence
                                            ) || 0;

                                        return (

                                            <tr
                                                key={
                                                    paymentId +
                                                    "-" +
                                                    index
                                                }
                                            >

                                                {/* CASE */}

                                                <td>

                                                    <div className="evaluation-case-id">

                                                        {paymentId}

                                                    </div>

                                                </td>


                                                {/* FAILURE */}

                                                <td>

                                                    <span className="evaluation-failure">

                                                        {formatAction(
                                                            category
                                                        )}

                                                    </span>

                                                </td>


                                                {/* AMOUNT */}

                                                <td>

                                                    <strong>
                                                        {formatAmount(
                                                            amount
                                                        )}
                                                    </strong>

                                                </td>


                                                {/* BASELINE */}

                                                <td>

                                                    <span
                                                        className={`evaluation-action ${getActionClass(
                                                            baseline
                                                        )}`}
                                                    >

                                                        {formatAction(
                                                            baseline
                                                        )}

                                                    </span>

                                                </td>


                                                {/* GEMINI */}

                                                <td>

                                                    <span
                                                        className={`evaluation-action ${getActionClass(
                                                            gemini
                                                        )}`}
                                                    >

                                                        <Brain
                                                            size={12}
                                                        />

                                                        {formatAction(
                                                            gemini
                                                        )}

                                                    </span>

                                                </td>


                                                {/* CONFIDENCE */}

                                                <td>

                                                    {formatPercent(
                                                        confidence *
                                                        100
                                                    )}

                                                </td>


                                                {/* OUTCOME */}

                                                <td>

                                                    <span
                                                        className={
                                                            normalizeOutcome(
                                                                outcome
                                                            ) ===
                                                                "RECOVERED"

                                                                ? "evaluation-outcome recovered"

                                                                : "evaluation-outcome not-recovered"
                                                        }
                                                    >

                                                        {formatAction(
                                                            outcome
                                                        )}

                                                    </span>

                                                </td>


                                                {/* RECOVERED */}

                                                <td>

                                                    <strong>
                                                        {formatAmount(
                                                            recovered
                                                        )}
                                                    </strong>

                                                </td>

                                            </tr>

                                        );
                                    }
                                )}

                            </tbody>

                        </table>

                    )}

                </div>

            </div>

        </div>
    );
}


// =============================================================
// NORMALIZATION HELPERS
// =============================================================

function normalizeAction(action) {

    if (!action) {
        return "";
    }

    return String(action)
        .trim()
        .toUpperCase()
        .replaceAll(" ", "_");
}


function normalizeOutcome(outcome) {

    if (!outcome) {
        return "";
    }

    return String(outcome)
        .trim()
        .toUpperCase()
        .replaceAll(" ", "_");
}


/**
 * The CSV contains actual_outcome rather than a separate
 * target_action.
 *
 * This function gives the evaluation page a consistent way
 * to judge whether a model's action agrees with the observed
 * outcome.
 */
function actionsMatchOutcome(
    action,
    outcome
) {

    const normalizedAction =
        normalizeAction(action);

    const normalizedOutcome =
        normalizeOutcome(outcome);

    if (!normalizedAction || !normalizedOutcome) {
        return false;
    }

    if (
        normalizedOutcome ===
        "RECOVERED"
    ) {

        return (
            normalizedAction ===
            "CONTROLLED_RETRY" ||
            normalizedAction ===
            "RETRY_LATER" ||
            normalizedAction ===
            "CUSTOMER_ACTION"
        );
    }

    if (
        normalizedOutcome ===
        "NOT_RECOVERED" ||
        normalizedOutcome ===
        "FAILED" ||
        normalizedOutcome ===
        "STOPPED"
    ) {

        return (
            normalizedAction ===
            "DO_NOT_RETRY" ||
            normalizedAction ===
            "HUMAN_REVIEW"
        );
    }

    return false;
}

export default Evaluation;
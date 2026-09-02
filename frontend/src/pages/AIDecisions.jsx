import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    Brain,
    RefreshCw,
    Search,
    ShieldCheck,
    AlertTriangle,
} from "lucide-react";

const API_BASE_URL = "http://localhost:8081";

function AIDecisions() {
    const [decisions, setDecisions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [actionFilter, setActionFilter] = useState("ALL");

    const loadDecisions = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                `${API_BASE_URL}/api/recovery-decisions`
            );

            setDecisions(response.data || []);
        } catch (err) {
            console.error(err);

            setError(
                "Unable to load AI decision data from the RIDE backend."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDecisions();
    }, []);

    const formatAmount = (amount) => {
        if (amount == null) return "₹0";

        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount / 100);
    };

    const filteredDecisions = useMemo(() => {
        return decisions.filter((decision) => {
            const paymentId =
                decision.paymentId?.toLowerCase() || "";

            const category =
                decision.failureCategory?.toLowerCase() || "";

            const action =
                decision.action?.toLowerCase() || "";

            const searchValue =
                search.toLowerCase().trim();

            const matchesSearch =
                !searchValue ||
                paymentId.includes(searchValue) ||
                category.includes(searchValue) ||
                action.includes(searchValue);

            const matchesAction =
                actionFilter === "ALL" ||
                decision.action === actionFilter;

            return matchesSearch && matchesAction;
        });
    }, [decisions, search, actionFilter]);

    const stats = useMemo(() => {
        const total = decisions.length;

        const overridden = decisions.filter(
            (d) => d.aiOverridden === true
        ).length;

        const aiUsed = decisions.filter(
            (d) => d.aiRecommendedAction
        ).length;

        const humanReview = decisions.filter(
            (d) => d.action === "HUMAN_REVIEW"
        ).length;

        return {
            total,
            aiUsed,
            overridden,
            humanReview,
        };
    }, [decisions]);

    const getActionClass = (action) => {
        switch (action) {
            case "CONTROLLED_RETRY":
                return "ai-action-retry";

            case "RETRY_LATER":
                return "ai-action-later";

            case "CUSTOMER_ACTION":
                return "ai-action-customer";

            case "DO_NOT_RETRY":
                return "ai-action-stop";

            case "HUMAN_REVIEW":
                return "ai-action-human";

            default:
                return "ai-action-neutral";
        }
    };

    const formatAction = (action) => {
        if (!action) return "—";

        return action
            .replaceAll("_", " ")
            .toLowerCase()
            .replace(/\b\w/g, (letter) =>
                letter.toUpperCase()
            );
    };

    return (
        <div className="page">

            {/* HEADER */}

            <div className="page-heading">

                <div>
                    <h1>AI Decisions</h1>

                    <p>
                        AI recommendations, confidence,
                        policy overrides, and final recovery decisions.
                    </p>
                </div>

                <button
                    className="refresh-button"
                    onClick={loadDecisions}
                    disabled={loading}
                >
                    <RefreshCw
                        size={15}
                        className={loading ? "spin" : ""}
                    />

                    Refresh
                </button>

            </div>

            {/* ERROR */}

            {error && (
                <div className="error-banner">

                    <AlertTriangle size={17} />

                    <span>{error}</span>

                </div>
            )}

            {/* KPI CARDS */}

            <div className="ai-summary">

                <div className="ai-summary-card">

                    <div className="ai-summary-icon">
                        <Brain size={19} />
                    </div>

                    <div>
                        <span>Total Decisions</span>
                        <strong>{stats.total}</strong>
                    </div>

                </div>

                <div className="ai-summary-card">

                    <div className="ai-summary-icon">
                        <Brain size={19} />
                    </div>

                    <div>
                        <span>AI Recommendations</span>
                        <strong>{stats.aiUsed}</strong>
                    </div>

                </div>

                <div className="ai-summary-card">

                    <div className="ai-summary-icon">
                        <ShieldCheck size={19} />
                    </div>

                    <div>
                        <span>Policy Overrides</span>
                        <strong>{stats.overridden}</strong>
                    </div>

                </div>

                <div className="ai-summary-card">

                    <div className="ai-summary-icon">
                        <AlertTriangle size={19} />
                    </div>

                    <div>
                        <span>Human Review</span>
                        <strong>{stats.humanReview}</strong>
                    </div>

                </div>

            </div>

            {/* FILTERS */}

            <div className="filter-bar">

                <div className="search-box">

                    <Search size={16} />

                    <input
                        type="text"
                        placeholder="Search payment, category or action..."
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                    />

                </div>

                <select
                    value={actionFilter}
                    onChange={(e) =>
                        setActionFilter(e.target.value)
                    }
                >
                    <option value="ALL">
                        All actions
                    </option>

                    <option value="CONTROLLED_RETRY">
                        Controlled Retry
                    </option>

                    <option value="RETRY_LATER">
                        Retry Later
                    </option>

                    <option value="CUSTOMER_ACTION">
                        Customer Action
                    </option>

                    <option value="HUMAN_REVIEW">
                        Human Review
                    </option>

                    <option value="DO_NOT_RETRY">
                        Do Not Retry
                    </option>
                </select>

            </div>

            {/* TABLE */}

            <div className="ai-table-container">

                {loading ? (

                    <div className="table-state">
                        Loading AI decisions...
                    </div>

                ) : filteredDecisions.length === 0 ? (

                    <div className="table-state">

                        <h3>No AI decisions found</h3>

                        <p>
                            No recovery decisions match the
                            current filters.
                        </p>

                    </div>

                ) : (

                    <table className="ai-table">

                        <thead>

                            <tr>
                                <th>Payment</th>
                                <th>Failure</th>
                                <th>AI Recommendation</th>
                                <th>Confidence</th>
                                <th>Final Decision</th>
                                <th>Policy</th>
                                <th>Revenue at Risk</th>
                            </tr>

                        </thead>

                        <tbody>

                            {filteredDecisions.map(
                                (decision, index) => (

                                    <tr
                                        key={
                                            decision.id ||
                                            `${decision.paymentId}-${index}`
                                        }
                                    >

                                        {/* PAYMENT */}

                                        <td>

                                            <div className="ai-payment-id">
                                                {decision.paymentId}
                                            </div>

                                            <div className="ai-attempt">
                                                Attempt #
                                                {decision.attemptNumber ?? "—"}
                                            </div>

                                        </td>

                                        {/* FAILURE */}

                                        <td>

                                            <span className="ai-failure-category">
                                                {formatAction(
                                                    decision.failureCategory
                                                )}
                                            </span>

                                        </td>

                                        {/* AI RECOMMENDATION */}

                                        <td>

                                            <span
                                                className={`ai-action-badge ${getActionClass(
                                                    decision.aiRecommendedAction
                                                )}`}
                                            >
                                                {formatAction(
                                                    decision.aiRecommendedAction
                                                )}
                                            </span>

                                        </td>

                                        {/* CONFIDENCE */}

                                        <td>

                                            <div className="ai-confidence">

                                                <div className="ai-confidence-value">
                                                    {decision.aiConfidence != null
                                                        ? `${Math.round(
                                                            decision.aiConfidence *
                                                            100
                                                        )}%`
                                                        : "—"}
                                                </div>

                                                {decision.aiConfidence != null && (
                                                    <div className="ai-confidence-bar">

                                                        <div
                                                            className="ai-confidence-fill"
                                                            style={{
                                                                width: `${Math.min(
                                                                    100,
                                                                    Math.max(
                                                                        0,
                                                                        decision.aiConfidence *
                                                                        100
                                                                    )
                                                                )}%`,
                                                            }}
                                                        />

                                                    </div>
                                                )}

                                            </div>

                                        </td>

                                        {/* FINAL DECISION */}

                                        <td>

                                            <span
                                                className={`ai-action-badge ${getActionClass(
                                                    decision.action
                                                )}`}
                                            >
                                                {formatAction(
                                                    decision.action
                                                )}
                                            </span>

                                        </td>

                                        {/* POLICY */}

                                        <td>

                                            {decision.aiOverridden ? (

                                                <span className="ai-policy-overridden">
                                                    <ShieldCheck size={14} />
                                                    Overridden
                                                </span>

                                            ) : (

                                                <span className="ai-policy-accepted">
                                                    <ShieldCheck size={14} />
                                                    Accepted
                                                </span>

                                            )}

                                        </td>

                                        {/* RISK */}

                                        <td>

                                            {formatAmount(
                                                decision.revenueAtRisk ??
                                                decision.amount
                                            )}

                                        </td>

                                    </tr>

                                )
                            )}

                        </tbody>

                    </table>

                )}

            </div>

        </div>
    );
}

export default AIDecisions;
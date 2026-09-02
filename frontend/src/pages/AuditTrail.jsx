import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    RefreshCw,
    Search,
    ShieldCheck,
    Brain,
    AlertTriangle,
    CheckCircle2,
    XCircle,
} from "lucide-react";

const API_BASE_URL = "http://localhost:8081";

function AuditTrail() {
    const [decisions, setDecisions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("ALL");

    const loadAuditTrail = async () => {
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
                "Unable to load audit trail from the RIDE backend."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAuditTrail();
    }, []);

    const formatAmount = (amount) => {
        if (amount == null) return "₹0";

        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount / 100);
    };

    const formatAction = (action) => {
        if (!action) return "—";

        return action
            .replaceAll("_", " ")
            .toLowerCase()
            .replace(/\b\w/g, (letter) => letter.toUpperCase());
    };

    const formatDate = (value) => {
        if (!value) return "—";

        try {
            return new Date(value).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
            });
        } catch {
            return value;
        }
    };

    const filteredDecisions = useMemo(() => {
        return decisions.filter((decision) => {
            const searchValue = search
                .toLowerCase()
                .trim();

            const paymentId =
                decision.paymentId?.toLowerCase() || "";

            const category =
                decision.failureCategory?.toLowerCase() || "";

            const action =
                decision.action?.toLowerCase() || "";

            const reason =
                decision.aiReason?.toLowerCase() || "";

            const matchesSearch =
                !searchValue ||
                paymentId.includes(searchValue) ||
                category.includes(searchValue) ||
                action.includes(searchValue) ||
                reason.includes(searchValue);

            let matchesFilter = true;

            if (filter === "OVERRIDDEN") {
                matchesFilter =
                    decision.aiOverridden === true;
            }

            if (filter === "ACCEPTED") {
                matchesFilter =
                    decision.aiOverridden !== true;
            }

            if (filter === "HUMAN_REVIEW") {
                matchesFilter =
                    decision.action === "HUMAN_REVIEW";
            }

            return matchesSearch && matchesFilter;
        });
    }, [decisions, search, filter]);

    const stats = useMemo(() => {
        const total = decisions.length;

        const overridden = decisions.filter(
            (decision) =>
                decision.aiOverridden === true
        ).length;

        const accepted = decisions.filter(
            (decision) =>
                decision.aiOverridden !== true
        ).length;

        const humanReview = decisions.filter(
            (decision) =>
                decision.action === "HUMAN_REVIEW"
        ).length;

        return {
            total,
            overridden,
            accepted,
            humanReview,
        };
    }, [decisions]);

    const getActionClass = (action) => {
        switch (action) {
            case "CONTROLLED_RETRY":
                return "audit-action-retry";

            case "RETRY_LATER":
                return "audit-action-later";

            case "CUSTOMER_ACTION":
                return "audit-action-customer";

            case "DO_NOT_RETRY":
                return "audit-action-stop";

            case "HUMAN_REVIEW":
                return "audit-action-human";

            default:
                return "audit-action-neutral";
        }
    };

    return (
        <div className="page">

            {/* HEADER */}

            <div className="page-heading">

                <div>
                    <h1>Audit Trail</h1>

                    <p>
                        Complete decision history showing AI reasoning,
                        policy validation, and final recovery actions.
                    </p>
                </div>

                <button
                    className="refresh-button"
                    onClick={loadAuditTrail}
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

            {/* SUMMARY */}

            <div className="audit-summary">

                <div className="audit-summary-card">

                    <div className="audit-summary-icon">
                        <ShieldCheck size={18} />
                    </div>

                    <div>
                        <span>Total Audit Records</span>
                        <strong>{stats.total}</strong>
                    </div>

                </div>

                <div className="audit-summary-card">

                    <div className="audit-summary-icon">
                        <CheckCircle2 size={18} />
                    </div>

                    <div>
                        <span>Policy Accepted</span>
                        <strong>{stats.accepted}</strong>
                    </div>

                </div>

                <div className="audit-summary-card">

                    <div className="audit-summary-icon">
                        <XCircle size={18} />
                    </div>

                    <div>
                        <span>AI Overridden</span>
                        <strong>{stats.overridden}</strong>
                    </div>

                </div>

                <div className="audit-summary-card">

                    <div className="audit-summary-icon">
                        <Brain size={18} />
                    </div>

                    <div>
                        <span>Human Review</span>
                        <strong>{stats.humanReview}</strong>
                    </div>

                </div>

            </div>

            {/* FILTER BAR */}

            <div className="filter-bar">

                <div className="search-box">

                    <Search size={16} />

                    <input
                        type="text"
                        placeholder="Search payment, failure or decision..."
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                    />

                </div>

                <select
                    value={filter}
                    onChange={(e) =>
                        setFilter(e.target.value)
                    }
                >
                    <option value="ALL">
                        All records
                    </option>

                    <option value="ACCEPTED">
                        Policy accepted
                    </option>

                    <option value="OVERRIDDEN">
                        AI overridden
                    </option>

                    <option value="HUMAN_REVIEW">
                        Human review
                    </option>
                </select>

            </div>

            {/* AUDIT TABLE */}

            <div className="audit-table-container">

                {loading ? (

                    <div className="table-state">
                        Loading audit trail...
                    </div>

                ) : filteredDecisions.length === 0 ? (

                    <div className="table-state">

                        <h3>No audit records found</h3>

                        <p>
                            No decision records match the current filters.
                        </p>

                    </div>

                ) : (

                    <table className="audit-table">

                        <thead>

                            <tr>
                                <th>Timestamp</th>
                                <th>Payment</th>
                                <th>Failure</th>
                                <th>AI Recommendation</th>
                                <th>Reason</th>
                                <th>Policy</th>
                                <th>Final Decision</th>
                                <th>Risk</th>
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

                                        {/* TIMESTAMP */}

                                        <td>
                                            <div className="audit-time">
                                                {formatDate(
                                                    decision.createdAt ||
                                                    decision.timestamp
                                                )}
                                            </div>
                                        </td>

                                        {/* PAYMENT */}

                                        <td>

                                            <div className="audit-payment-id">
                                                {decision.paymentId || "—"}
                                            </div>

                                            <div className="audit-attempt">
                                                Attempt #
                                                {decision.attemptNumber ?? "—"}
                                            </div>

                                        </td>

                                        {/* FAILURE */}

                                        <td>

                                            <span className="audit-failure">
                                                {formatAction(
                                                    decision.failureCategory
                                                )}
                                            </span>

                                        </td>

                                        {/* AI */}

                                        <td>

                                            <span
                                                className={`audit-action-badge ${getActionClass(
                                                    decision.aiRecommendedAction
                                                )}`}
                                            >
                                                <Brain size={12} />

                                                {formatAction(
                                                    decision.aiRecommendedAction
                                                )}
                                            </span>

                                        </td>

                                        {/* REASON */}

                                        <td>

                                            <div className="audit-reason">

                                                {decision.aiReason ||
                                                    decision.reason ||
                                                    "No reason recorded"}

                                            </div>

                                        </td>

                                        {/* POLICY */}

                                        <td>

                                            {decision.aiOverridden ? (

                                                <span className="audit-policy-overridden">

                                                    <XCircle size={14} />

                                                    Overridden

                                                </span>

                                            ) : (

                                                <span className="audit-policy-accepted">

                                                    <ShieldCheck size={14} />

                                                    Accepted

                                                </span>

                                            )}

                                        </td>

                                        {/* FINAL */}

                                        <td>

                                            <span
                                                className={`audit-action-badge ${getActionClass(
                                                    decision.action
                                                )}`}
                                            >
                                                {formatAction(
                                                    decision.action
                                                )}
                                            </span>

                                        </td>

                                        {/* RISK */}

                                        <td>

                                            <strong>
                                                {formatAmount(
                                                    decision.revenueAtRisk ??
                                                    decision.amount
                                                )}
                                            </strong>

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

export default AuditTrail;
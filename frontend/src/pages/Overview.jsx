import { useEffect, useMemo, useState } from "react";
import {
    AlertTriangle,
    Brain,
    CheckCircle2,
    Clock3,
    IndianRupee,
    RefreshCw,
    ShieldAlert,
    WalletCards
} from "lucide-react";

import {
    BarChart,
    Bar,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";

import { getDashboardData } from "../services/dashboardService";


// =============================================================
// FORMAT MONEY
// Razorpay amounts are stored in paise
// =============================================================

const formatMoney = (paise) => {

    return `₹${(paise / 100).toLocaleString("en-IN", {
        maximumFractionDigits: 0
    })}`;
};


// =============================================================
// FORMAT NUMBER
// =============================================================

const formatNumber = (value) => {

    return value.toLocaleString("en-IN");

};


export default function Overview() {

    const [data, setData] = useState({
        payments: [],
        attempts: [],
        decisions: []
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    // =========================================================
    // LOAD DASHBOARD DATA
    // =========================================================

    const loadDashboard = async () => {

        try {

            setLoading(true);
            setError("");

            const result =
                await getDashboardData();

            setData(result);

        } catch (err) {

            console.error(
                "RIDE dashboard error:",
                err
            );

            setError(
                "Unable to load dashboard data. Make sure Spring Boot is running on port 8081."
            );

        } finally {

            setLoading(false);

        }
    };


    useEffect(() => {

        loadDashboard();

    }, []);


    // =========================================================
    // DASHBOARD METRICS
    //
    // VERY IMPORTANT:
    //
    // Payment ID = individual payment attempt
    // Order ID   = one purchase / revenue opportunity
    //
    // Therefore:
    //
    // ₹200 order
    //   payment 1 failed
    //   payment 2 failed
    //   ...
    //   payment 11 failed
    //   payment 12 captured
    //
    // Revenue at Risk = ₹0
    // Recovered Revenue = ₹200
    //
    // NOT:
    //
    // 11 × ₹200 = ₹2200
    //
    // =========================================================

    const metrics = useMemo(() => {

        const payments =
            data.payments || [];

        const attempts =
            data.attempts || [];

        const decisions =
            data.decisions || [];


        // =====================================================
        // FAILED ATTEMPTS
        //
        // This is still individual payment attempts.
        //
        // Example:
        // 11 failed payments = 11 failed attempts
        // =====================================================

        const failedAttempts =
            attempts.filter(
                attempt =>
                    attempt.status === "failed"
            );


        // =====================================================
        // GROUP PAYMENTS BY ORDER
        //
        // Each order represents ONE purchase/revenue
        // opportunity.
        // =====================================================

        const orders = {};

        payments.forEach(payment => {

            const orderId =
                payment.orderId;

            if (!orderId) {
                return;
            }

            if (!orders[orderId]) {

                orders[orderId] = [];

            }

            orders[orderId].push(payment);

        });


        // =====================================================
        // CALCULATE ORDER-LEVEL REVENUE
        // =====================================================

        let revenueAtRisk = 0;
        let recoveredRevenue = 0;

        let recoveryCases = 0;
        let recoveredOrders = 0;


        Object.values(orders).forEach(
            orderPayments => {

                // -------------------------------------------------
                // Check whether ANY payment for this order succeeded
                // -------------------------------------------------

                const successfulPayment =
                    orderPayments.find(
                        payment =>
                            payment.status === "captured" ||
                            payment.status === "recovered"
                    );


                // -------------------------------------------------
                // ORDER RECOVERED
                // -------------------------------------------------

                if (successfulPayment) {

                    recoveredOrders++;

                    recoveredRevenue +=
                        successfulPayment.amount || 0;

                    return;
                }


                // -------------------------------------------------
                // ORDER NOT RECOVERED
                //
                // Find the payment amount.
                //
                // We count the ORDER amount only once,
                // not once per failed attempt.
                // -------------------------------------------------

                const failedPayment =
                    orderPayments.find(
                        payment =>
                            payment.status === "failed"
                    );

                if (failedPayment) {

                    recoveryCases++;

                    revenueAtRisk +=
                        failedPayment.amount || 0;

                }

            }
        );


        // =====================================================
        // FALLBACK FOR PAYMENTS WITHOUT ORDER ID
        // =====================================================
        //
        // Normally Razorpay payments should have orderId.
        // This prevents those records from disappearing
        // from dashboard calculations.
        // =====================================================

        const paymentsWithoutOrder =
            payments.filter(
                payment =>
                    !payment.orderId
            );


        paymentsWithoutOrder.forEach(
            payment => {

                if (
                    payment.status === "captured" ||
                    payment.status === "recovered"
                ) {

                    recoveredRevenue +=
                        payment.amount || 0;

                    recoveredOrders++;

                } else if (
                    payment.status === "failed"
                ) {

                    revenueAtRisk +=
                        payment.amount || 0;

                    recoveryCases++;

                }

            }
        );


        // =====================================================
        // RECOVERY RATE
        //
        // Recovery opportunity =
        //
        // recovered revenue + currently at-risk revenue
        //
        // Example:
        //
        // ₹200 recovered
        // ₹0 currently at risk
        //
        // Recovery Rate = 100%
        //
        // =====================================================

        const recoveryOpportunity =
            recoveredRevenue +
            revenueAtRisk;


        const recoveryRate =
            recoveryOpportunity > 0
                ? (
                    recoveredRevenue /
                    recoveryOpportunity
                ) * 100
                : 0;


        // =====================================================
        // HUMAN REVIEW
        // =====================================================

        const humanReviewCount =
            decisions.filter(
                decision =>
                    decision.action ===
                    "HUMAN_REVIEW"
            ).length;


        // =====================================================
        // AI DECISIONS
        // =====================================================

        const aiDecisionCount =
            decisions.length;


        // =====================================================
        // RETURN METRICS
        // =====================================================

        return {

            payments,

            attempts,

            decisions,

            failedAttempts,

            revenueAtRisk,

            recoveredRevenue,

            recoveryRate,

            recoveryCases,

            recoveredOrders,

            humanReviewCount,

            aiDecisionCount

        };

    }, [data]);


    // =========================================================
    // FAILURE CATEGORY CHART
    //
    // This intentionally counts ATTEMPTS because the chart
    // is showing failure distribution.
    // =========================================================

    const failureData = useMemo(() => {

        const counts = {};

        data.attempts.forEach(
            attempt => {

                const category =
                    attempt.failureCategory ||
                    "UNKNOWN";

                counts[category] =
                    (counts[category] || 0) + 1;

            }
        );


        return Object.entries(
            counts
        ).map(
            ([category, count]) => ({

                category:
                    category.replaceAll(
                        "_",
                        " "
                    ),

                count

            })
        );

    }, [data.attempts]);


    // =========================================================
    // RECENT RECOVERY DECISIONS
    // =========================================================

    const recentCases = useMemo(() => {

        return [
            ...data.decisions
        ]
            .sort(
                (a, b) =>
                    new Date(
                        b.createdAt || 0
                    ) -
                    new Date(
                        a.createdAt || 0
                    )
            )
            .slice(0, 6);

    }, [data.decisions]);


    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {

        return (

            <div className="dashboard-state">

                <RefreshCw size={22} />

                <span>
                    Loading RIDE intelligence...
                </span>

            </div>

        );

    }


    // =========================================================
    // ERROR
    // =========================================================

    if (error) {

        return (

            <div className="dashboard-state error">

                <ShieldAlert size={24} />

                <div>

                    <strong>
                        Dashboard unavailable
                    </strong>

                    <p>
                        {error}
                    </p>

                    <button
                        onClick={loadDashboard}
                    >
                        Retry
                    </button>

                </div>

            </div>

        );

    }


    // =========================================================
    // UI
    // =========================================================

    return (

        <div className="overview-page">


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="page-header">

                <div>

                    <h1>
                        Overview
                    </h1>

                    <p>
                        Revenue recovery intelligence
                        from live payment data
                    </p>

                </div>


                <button
                    className="refresh-button"
                    onClick={loadDashboard}
                >

                    <RefreshCw
                        size={16}
                    />

                    Refresh

                </button>

            </div>


            {/* =================================================
                KPI CARDS
            ================================================= */}

            <div className="kpi-grid">


                {/* REVENUE AT RISK */}

                <MetricCard
                    title="Revenue at Risk"
                    value={formatMoney(
                        metrics.revenueAtRisk
                    )}
                    icon={
                        <AlertTriangle
                            size={20}
                        />
                    }
                    description="Outstanding purchase value"
                />


                {/* RECOVERED REVENUE */}

                <MetricCard
                    title="Recovered Revenue"
                    value={formatMoney(
                        metrics.recoveredRevenue
                    )}
                    icon={
                        <CheckCircle2
                            size={20}
                        />
                    }
                    description="Successfully recovered purchase value"
                />


                {/* RECOVERY RATE */}

                <MetricCard
                    title="Recovery Rate"
                    value={`${metrics.recoveryRate.toFixed(1)}%`}
                    icon={
                        <IndianRupee
                            size={20}
                        />
                    }
                    description="Recovered revenue vs recovery opportunity"
                />


                {/* FAILED ATTEMPTS */}

                <MetricCard
                    title="Failed Attempts"
                    value={formatNumber(
                        metrics.failedAttempts.length
                    )}
                    icon={
                        <WalletCards
                            size={20}
                        />
                    }
                    description="Recorded payment failures"
                />


                {/* AI DECISIONS */}

                <MetricCard
                    title="AI Decisions"
                    value={formatNumber(
                        metrics.aiDecisionCount
                    )}
                    icon={
                        <Brain
                            size={20}
                        />
                    }
                    description="Recovery decisions generated"
                />


                {/* HUMAN REVIEW */}

                <MetricCard
                    title="Human Review"
                    value={formatNumber(
                        metrics.humanReviewCount
                    )}
                    icon={
                        <Clock3
                            size={20}
                        />
                    }
                    description="Cases requiring human approval"
                />

            </div>


            {/* =================================================
                CHARTS
            ================================================= */}

            <div className="dashboard-grid">


                {/* FAILURE CATEGORIES */}

                <section className="dashboard-card">

                    <div className="card-header">

                        <div>

                            <h2>
                                Failure Categories
                            </h2>

                            <p>
                                Distribution of recorded failures
                            </p>

                        </div>

                    </div>


                    <div className="chart-container">

                        {failureData.length === 0 ? (

                            <div className="empty-state">

                                No payment attempts available

                            </div>

                        ) : (

                            <ResponsiveContainer
                                width="100%"
                                height="100%"
                            >

                                <BarChart
                                    data={failureData}
                                >

                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                    />

                                    <XAxis
                                        dataKey="category"
                                        tick={{
                                            fontSize: 11
                                        }}
                                    />

                                    <YAxis />

                                    <Tooltip />

                                    <Bar
                                        dataKey="count"
                                        name="Attempts"
                                    />

                                </BarChart>

                            </ResponsiveContainer>

                        )}

                    </div>

                </section>


                {/* =================================================
                    RECOVERY SUMMARY
                ================================================= */}

                <section className="dashboard-card">

                    <div className="card-header">

                        <div>

                            <h2>
                                Recovery Summary
                            </h2>

                            <p>
                                Current revenue position
                            </p>

                        </div>

                    </div>


                    <div className="recovery-summary">


                        <SummaryRow
                            label="Revenue at risk"
                            value={formatMoney(
                                metrics.revenueAtRisk
                            )}
                        />


                        <SummaryRow
                            label="Recovered"
                            value={formatMoney(
                                metrics.recoveredRevenue
                            )}
                        />


                        <SummaryRow
                            label="Recovery rate"
                            value={`${metrics.recoveryRate.toFixed(1)}%`}
                        />


                        <SummaryRow
                            label="Failed attempts"
                            value={formatNumber(
                                metrics.failedAttempts.length
                            )}
                        />


                        <SummaryRow
                            label="AI decisions"
                            value={formatNumber(
                                metrics.aiDecisionCount
                            )}
                        />


                        <SummaryRow
                            label="Human review"
                            value={formatNumber(
                                metrics.humanReviewCount
                            )}
                        />

                    </div>

                </section>

            </div>


            {/* =================================================
                RECENT DECISIONS
            ================================================= */}

            <section className="dashboard-card recent-card">

                <div className="card-header">

                    <div>

                        <h2>
                            Recent Recovery Decisions
                        </h2>

                        <p>
                            Latest decisions generated by RIDE
                        </p>

                    </div>

                </div>


                {recentCases.length === 0 ? (

                    <div className="empty-state">

                        No recovery decisions recorded yet.

                    </div>

                ) : (

                    <div className="table-wrapper">

                        <table>

                            <thead>

                                <tr>

                                    <th>
                                        Payment
                                    </th>

                                    <th>
                                        Failure
                                    </th>

                                    <th>
                                        Decision
                                    </th>

                                    <th>
                                        AI Confidence
                                    </th>

                                    <th>
                                        Human Approval
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {recentCases.map(
                                    (decision, index) => (

                                        <tr
                                            key={
                                                decision.id ||
                                                index
                                            }
                                        >

                                            <td>

                                                <code>
                                                    {
                                                        decision.paymentId
                                                    }
                                                </code>

                                            </td>


                                            <td>

                                                {
                                                    decision.failureCategory ||
                                                    "UNKNOWN"
                                                }

                                            </td>


                                            <td>

                                                <span className="decision-badge">

                                                    {
                                                        decision.action
                                                    }

                                                </span>

                                            </td>


                                            <td>

                                                {
                                                    decision.aiConfidence != null
                                                        ? `${(
                                                            decision.aiConfidence *
                                                            100
                                                        ).toFixed(0)}%`
                                                        : "—"
                                                }

                                            </td>


                                            <td>

                                                {
                                                    decision.requiresHumanApproval
                                                        ? "Required"
                                                        : "No"
                                                }

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </section>

        </div>

    );
}


// =============================================================
// METRIC CARD
// =============================================================

function MetricCard({
    title,
    value,
    icon,
    description
}) {

    return (

        <div className="metric-card">

            <div className="metric-top">

                <span className="metric-icon">
                    {icon}
                </span>

                <span className="metric-title">
                    {title}
                </span>

            </div>


            <strong className="metric-value">
                {value}
            </strong>


            <span className="metric-description">
                {description}
            </span>

        </div>

    );

}


// =============================================================
// SUMMARY ROW
// =============================================================

function SummaryRow({
    label,
    value
}) {

    return (

        <div className="summary-row">

            <span>
                {label}
            </span>

            <strong>
                {value}
            </strong>

        </div>

    );

}
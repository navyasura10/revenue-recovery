import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
    AlertTriangle,
    RefreshCw,
    Search,
    ArrowRight,
} from "lucide-react";

const API_BASE_URL = "http://localhost:8081";

function RecoveryCases() {

    const navigate = useNavigate();

    const [payments, setPayments] = useState([]);
    const [attempts, setAttempts] = useState([]);
    const [decisions, setDecisions] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    // =========================================================
    // LOAD REAL BACKEND DATA
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
                axios.get(`${API_BASE_URL}/api/payments`),
                axios.get(`${API_BASE_URL}/api/payment-attempts`),
                axios.get(`${API_BASE_URL}/api/recovery-decisions`),
            ]);

            setPayments(paymentsResponse.data || []);
            setAttempts(attemptsResponse.data || []);
            setDecisions(decisionsResponse.data || []);

        } catch (err) {

            console.error(
                "RIDE data loading error:",
                err
            );

            setError(
                "Unable to load recovery data from the RIDE backend."
            );

        } finally {

            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // =========================================================
    // FORMAT AMOUNT
    // Razorpay amounts are stored in paise
    // =========================================================

    const formatAmount = (amount) => {

        if (amount == null) {
            return "₹0";
        }

        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount / 100);
    };

    // =========================================================
    // GET TIMESTAMP
    // Used to determine the chronological order of payments
    // belonging to the same Razorpay order.
    // =========================================================

    const getPaymentTimestamp = (payment) => {

        if (payment.createdAt) {
            return new Date(payment.createdAt).getTime();
        }

        if (payment.updatedAt) {
            return new Date(payment.updatedAt).getTime();
        }

        return 0;
    };

    // =========================================================
    // BUILD RECOVERY CASES
    //
    // IMPORTANT:
    //
    // paymentId = one payment attempt
    // orderId   = one purchase / revenue opportunity
    //
    // Therefore:
    //
    // order_X
    //   payment_1 -> Attempt 1
    //   payment_2 -> Attempt 2
    //   payment_3 -> Attempt 3
    //   ...
    //   payment_12 -> Attempt 12 -> captured
    //
    // We calculate the DISPLAY attempt number from the
    // chronological payments belonging to the same order.
    // We do NOT trust duplicated backend attemptNumber values.
    // =========================================================

    const cases = useMemo(() => {

        // -----------------------------------------------------
        // 1. GROUP PAYMENTS BY ORDER ID
        // -----------------------------------------------------

        const paymentsByOrder = {};

        payments.forEach((payment) => {

            const orderId = payment.orderId;

            if (!orderId) {
                return;
            }

            if (!paymentsByOrder[orderId]) {
                paymentsByOrder[orderId] = [];
            }

            paymentsByOrder[orderId].push(payment);
        });

        // -----------------------------------------------------
        // 2. SORT PAYMENTS WITHIN EACH ORDER
        // -----------------------------------------------------

        Object.values(paymentsByOrder).forEach(
            (orderPayments) => {

                orderPayments.sort(
                    (a, b) =>
                        getPaymentTimestamp(a) -
                        getPaymentTimestamp(b)
                );
            }
        );

        // -----------------------------------------------------
        // 3. CREATE DISPLAY CASES
        // -----------------------------------------------------

        const result = [];

        Object.values(paymentsByOrder).forEach(
            (orderPayments) => {

                orderPayments.forEach(
                    (payment, index) => {

                        // -------------------------------------
                        // DISPLAY ATTEMPT NUMBER
                        // -------------------------------------

                        const displayAttemptNumber =
                            index + 1;

                        // -------------------------------------
                        // FIND THE PAYMENT ATTEMPT RECORD
                        // -------------------------------------
                        //
                        // Each paymentId represents one
                        // actual Razorpay payment attempt.
                        //
                        // This is much safer than using the
                        // duplicated attemptNumber field.
                        // -------------------------------------

                        const matchingAttempt =
                            attempts.find(
                                (attempt) =>
                                    attempt.paymentId ===
                                    payment.paymentId
                            ) || null;

                        // -------------------------------------
                        // FAILURE CATEGORY
                        // -------------------------------------

                        const failureCategory =
                            matchingAttempt?.failureCategory ||
                            null;

                        // -------------------------------------
                        // FAILURE DETAILS
                        // -------------------------------------

                        const failureCode =
                            matchingAttempt?.failureCode ||
                            payment.failureCode ||
                            null;

                        const failureReason =
                            matchingAttempt?.failureReason ||
                            payment.failureReason ||
                            null;

                        // -------------------------------------
                        // STATUS
                        // -------------------------------------

                        const status =
                            payment.status || "unknown";

                        // -------------------------------------
                        // RECOVERY STATE
                        // -------------------------------------

                        const isCaptured =
                            status === "captured";

                        const isFailed =
                            status === "failed";

                        // -------------------------------------
                        // REVENUE AT RISK FOR THIS ROW
                        //
                        // A failed payment attempt can show
                        // the purchase amount.
                        //
                        // BUT Overview will calculate revenue
                        // at risk at ORDER level.
                        //
                        // Therefore 11 failed rows of ₹200
                        // do NOT mean ₹2200 actually at risk.
                        // -------------------------------------

                        const revenueAtRisk =
                            isFailed
                                ? payment.amount || 0
                                : 0;

                        // -------------------------------------
                        // DECISION FOR THIS PAYMENT
                        // -------------------------------------

                        const paymentDecisions =
                            decisions
                                .filter(
                                    (decision) =>
                                        decision.paymentId ===
                                        payment.paymentId
                                )
                                .sort(
                                    (a, b) =>
                                        new Date(
                                            b.createdAt || 0
                                        ) -
                                        new Date(
                                            a.createdAt || 0
                                        )
                                );

                        const latestDecision =
                            paymentDecisions[0] || null;

                        // -------------------------------------
                        // ADD CASE
                        // -------------------------------------

                        result.push({

                            ...payment,

                            // Display attempt number
                            attemptNumber:
                                displayAttemptNumber,

                            // Matching backend attempt
                            latestAttempt:
                                matchingAttempt,

                            // Failure information
                            failureCategory,
                            failureCode,
                            failureReason,

                            // Revenue for this individual
                            // failed payment row
                            revenueAtRisk,

                            // Whether this particular payment
                            // captured successfully
                            recovered: isCaptured,

                            latestDecision,

                        });
                    }
                );
            }
        );

        // -----------------------------------------------------
        // 4. HANDLE PAYMENTS WITHOUT ORDER ID
        // -----------------------------------------------------
        //
        // This is only a safety fallback.
        // Normally Razorpay payments should have orderId.
        // -----------------------------------------------------

        payments
            .filter(
                (payment) =>
                    !payment.orderId
            )
            .forEach(
                (payment) => {

                    const matchingAttempt =
                        attempts.find(
                            (attempt) =>
                                attempt.paymentId ===
                                payment.paymentId
                        ) || null;

                    const isFailed =
                        payment.status === "failed";

                    result.push({

                        ...payment,

                        attemptNumber:
                            matchingAttempt?.attemptNumber ||
                            1,

                        latestAttempt:
                            matchingAttempt,

                        failureCategory:
                            matchingAttempt?.failureCategory ||
                            null,

                        failureCode:
                            matchingAttempt?.failureCode ||
                            payment.failureCode ||
                            null,

                        failureReason:
                            matchingAttempt?.failureReason ||
                            payment.failureReason ||
                            null,

                        revenueAtRisk:
                            isFailed
                                ? payment.amount || 0
                                : 0,

                        recovered:
                            payment.status === "captured",

                        latestDecision:
                            null,
                    });
                }
            );

        // -----------------------------------------------------
        // 5. SORT ALL CASES
        // Newest payments first.
        // -----------------------------------------------------

        result.sort(
            (a, b) =>
                getPaymentTimestamp(b) -
                getPaymentTimestamp(a)
        );

        return result;

    }, [payments, attempts, decisions]);

    // =========================================================
    // FILTER
    // =========================================================

    const filteredCases = useMemo(() => {

        return cases.filter((item) => {

            const searchValue =
                search
                    .toLowerCase()
                    .trim();

            const matchesSearch =
                !searchValue ||
                item.paymentId
                    ?.toLowerCase()
                    .includes(searchValue) ||
                item.orderId
                    ?.toLowerCase()
                    .includes(searchValue);

            const matchesStatus =
                statusFilter === "ALL" ||
                item.status === statusFilter;

            return (
                matchesSearch &&
                matchesStatus
            );
        });

    }, [
        cases,
        search,
        statusFilter,
    ]);

    // =========================================================
    // STATUS STYLE
    // =========================================================

    const getStatusClass = (status) => {

        if (status === "captured") {
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
    // UI
    // =========================================================

    return (

        <div className="page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="page-heading">

                <div>

                    <h1>
                        Recovery Cases
                    </h1>

                    <p>
                        Payment attempts and recovery history
                        from live payment data.
                    </p>

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
                ERROR
            ================================================= */}

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

            {/* =================================================
                FILTER BAR
            ================================================= */}

            <div className="filter-bar">

                <div className="search-box">

                    <Search
                        size={16}
                    />

                    <input
                        type="text"
                        placeholder="Search payment or order ID..."
                        value={search}
                        onChange={(e) =>
                            setSearch(
                                e.target.value
                            )
                        }
                    />

                </div>

                <select
                    value={statusFilter}
                    onChange={(e) =>
                        setStatusFilter(
                            e.target.value
                        )
                    }
                >

                    <option value="ALL">
                        All statuses
                    </option>

                    <option value="failed">
                        Failed
                    </option>

                    <option value="authorized">
                        Authorized
                    </option>

                    <option value="captured">
                        Captured
                    </option>

                </select>

            </div>

            {/* =================================================
                TABLE
            ================================================= */}

            <div className="cases-table-container">

                {loading ? (

                    <div className="table-state">

                        Loading payment data...

                    </div>

                ) : filteredCases.length === 0 ? (

                    <div className="table-state">

                        <h3>
                            No recovery cases found
                        </h3>

                        <p>
                            No payment records match
                            the current filters.
                        </p>

                    </div>

                ) : (

                    <table className="cases-table">

                        <thead>

                            <tr>

                                <th>
                                    Payment
                                </th>

                                <th>
                                    Amount
                                </th>

                                <th>
                                    Status
                                </th>

                                <th>
                                    Failure
                                </th>

                                <th>
                                    Attempt
                                </th>

                                <th>
                                    Revenue at Risk
                                </th>

                                <th>
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {filteredCases.map(
                                (item) => (

                                    <tr
                                        key={
                                            item.paymentId
                                        }
                                    >

                                        {/* =================
                                            PAYMENT
                                        ================= */}

                                        <td>

                                            <div className="payment-id">
                                                {
                                                    item.paymentId
                                                }
                                            </div>

                                            <div className="order-id">
                                                {
                                                    item.orderId ||
                                                    "—"
                                                }
                                            </div>

                                        </td>

                                        {/* =================
                                            AMOUNT
                                        ================= */}

                                        <td>

                                            {formatAmount(
                                                item.amount
                                            )}

                                        </td>

                                        {/* =================
                                            STATUS
                                        ================= */}

                                        <td>

                                            <span
                                                className={
                                                    `status-badge ${getStatusClass(
                                                        item.status
                                                    )}`
                                                }
                                            >

                                                {item.recovered
                                                    ? "captured"
                                                    : item.status ||
                                                    "unknown"}

                                            </span>

                                        </td>

                                        {/* =================
                                            FAILURE
                                        ================= */}

                                        <td>

                                            {item.failureCategory ? (

                                                <span className="failure-category">

                                                    {
                                                        item.failureCategory
                                                    }

                                                </span>

                                            ) : (

                                                "—"

                                            )}

                                        </td>

                                        {/* =================
                                            ATTEMPT
                                        ================= */}

                                        <td>

                                            {item.attemptNumber > 0
                                                ? item.attemptNumber
                                                : "—"}

                                        </td>

                                        {/* =================
                                            REVENUE AT RISK
                                        ================= */}

                                        <td>

                                            {item.revenueAtRisk > 0

                                                ? formatAmount(
                                                    item.revenueAtRisk
                                                )

                                                : "—"}

                                        </td>

                                        {/* =================
                                            VIEW CASE
                                        ================= */}

                                        <td>

                                            <button
                                                type="button"
                                                className="case-arrow"
                                                title="View case"
                                                onClick={() => {

                                                    console.log(
                                                        "CLICKED:",
                                                        item.paymentId
                                                    );

                                                    navigate(
                                                        `/recovery-cases/${encodeURIComponent(
                                                            item.paymentId
                                                        )}`
                                                    );

                                                }}
                                            >

                                                <ArrowRight
                                                    size={16}
                                                />

                                            </button>

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

export default RecoveryCases;
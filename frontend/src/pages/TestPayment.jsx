import { useEffect, useState } from "react";
import axios from "axios";
import {
    ArrowLeft,
    CheckCircle2,
    CreditCard,
    IndianRupee,
    RefreshCw,
    ShieldCheck,
    ShoppingBag,
    AlertTriangle,
    Smartphone,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:8081";

const STORAGE_KEY = "ride_test_orders";

function TestPayment() {
    const navigate = useNavigate();

    const [amount, setAmount] = useState("200");
    const [orders, setOrders] = useState([]);
    const [creating, setCreating] = useState(false);
    const [payingOrderId, setPayingOrderId] = useState(null);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    // =========================================================
    // LOAD LOCAL TEST ORDERS
    // =========================================================

    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);

            if (saved) {
                const parsed = JSON.parse(saved);

                if (Array.isArray(parsed)) {
                    setOrders(parsed);
                }
            }
        } catch (err) {
            console.error(
                "Unable to load local test orders:",
                err
            );
        }
    }, []);

    // =========================================================
    // SAVE ORDERS
    // =========================================================

    const saveOrders = (updatedOrders) => {
        setOrders(updatedOrders);

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(updatedOrders)
        );
    };

    // =========================================================
    // CREATE RAZORPAY TEST ORDER
    // =========================================================

    const createOrder = async () => {
        try {
            setCreating(true);
            setError("");
            setMessage("");

            const amountValue = Number(amount);

            if (
                !Number.isFinite(amountValue) ||
                amountValue <= 0
            ) {
                setError(
                    "Please enter a valid amount greater than ₹0."
                );

                return;
            }

            const response = await axios.post(
                `${API_BASE_URL}/api/test-payments/orders`,
                {
                    amount: amountValue,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            console.log(
                "Create order response:",
                response.data
            );

            const data = response.data;

            if (!data || !data.success) {
                throw new Error(
                    data?.message ||
                    "Unable to create Razorpay test order."
                );
            }

            const newOrder = {
                orderId: data.orderId,
                amount: data.amount,
                currency: data.currency || "INR",
                receipt: data.receipt,
                status: data.status || "created",
                keyId: data.keyId,
                createdAt: new Date().toISOString(),
            };

            const updatedOrders = [
                newOrder,
                ...orders,
            ];

            saveOrders(updatedOrders);

            setMessage(
                "Test order created successfully."
            );
        } catch (err) {
            console.error(
                "Create test order error:",
                err
            );

            console.error(
                "Backend response:",
                err.response?.data
            );

            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                "Unable to create Razorpay test order."
            );
        } finally {
            setCreating(false);
        }
    };

    // =========================================================
    // PAY ORDER USING RAZORPAY CHECKOUT
    // =========================================================

    const payOrder = async (order) => {
        try {
            setPayingOrderId(order.orderId);
            setError("");
            setMessage("");

            // -------------------------------------------------
            // Load Razorpay Checkout
            // -------------------------------------------------

            await loadRazorpayScript();

            if (!window.Razorpay) {
                throw new Error(
                    "Razorpay Checkout could not be loaded."
                );
            }

            // -------------------------------------------------
            // RAZORPAY CHECKOUT OPTIONS
            // -------------------------------------------------

            const options = {
                key: order.keyId,

                amount: order.amount,

                currency:
                    order.currency || "INR",

                name: "RIDE Test Merchant",

                description:
                    "RIDE Revenue Recovery Test Payment",

                order_id: order.orderId,

                // -------------------------------------------------
                // CUSTOMER DETAILS
                // -------------------------------------------------

                prefill: {
                    name: "RIDE Test Customer",
                    email: "test@ride.local",
                    contact: "+919893456746",
                },

                // -------------------------------------------------
                // PAYMENT METHOD CONFIGURATION
                //
                // UPI is explicitly included here.
                // -------------------------------------------------

                config: {
                    display: {
                        blocks: {
                            ride_payment_methods: {
                                name: "Payment Options",

                                instruments: [
                                    {
                                        method: "upi",
                                    },
                                    {
                                        method: "card",
                                    },
                                    {
                                        method: "netbanking",
                                    },
                                    {
                                        method: "wallet",
                                    },
                                ],
                            },
                        },

                        sequence: [
                            "block.ride_payment_methods",
                        ],

                        preferences: {
                            show_default_blocks: false,
                        },
                    },
                },

                // -------------------------------------------------
                // SUCCESS
                // -------------------------------------------------

                handler: function (response) {
                    console.log(
                        "Razorpay payment successful:",
                        response
                    );

                    setMessage(
                        "Payment completed. Waiting for Razorpay webhook..."
                    );

                    const updatedOrders =
                        orders.map((item) =>
                            item.orderId ===
                                order.orderId
                                ? {
                                    ...item,

                                    status:
                                        "payment_submitted",

                                    paymentId:
                                        response.razorpay_payment_id,

                                    submittedAt:
                                        new Date().toISOString(),
                                }
                                : item
                        );

                    saveOrders(updatedOrders);

                    setPayingOrderId(null);
                },

                // -------------------------------------------------
                // MODAL
                // -------------------------------------------------

                modal: {
                    ondismiss: function () {
                        console.log(
                            "Razorpay Checkout closed."
                        );

                        setPayingOrderId(null);
                    },
                },

                // -------------------------------------------------
                // THEME
                // -------------------------------------------------

                theme: {
                    color: "#111827",
                },
            };

            console.log(
                "Opening Razorpay with options:",
                options
            );

            const razorpay =
                new window.Razorpay(options);

            // -------------------------------------------------
            // PAYMENT FAILED
            // -------------------------------------------------

            razorpay.on(
                "payment.failed",
                function (response) {
                    console.error(
                        "Razorpay payment failed:",
                        response
                    );

                    setError(
                        response?.error?.description ||
                        "Test payment failed."
                    );

                    setPayingOrderId(null);
                }
            );

            razorpay.open();
        } catch (err) {
            console.error(
                "Payment error:",
                err
            );

            setError(
                err.message ||
                "Unable to open Razorpay Checkout."
            );

            setPayingOrderId(null);
        }
    };

    // =========================================================
    // LOAD RAZORPAY SCRIPT
    // =========================================================

    const loadRazorpayScript = () => {
        return new Promise(
            (resolve, reject) => {
                if (window.Razorpay) {
                    resolve(true);
                    return;
                }

                const script =
                    document.createElement(
                        "script"
                    );

                script.src =
                    "https://checkout.razorpay.com/v1/checkout.js";

                script.onload = () =>
                    resolve(true);

                script.onerror = () =>
                    reject(
                        new Error(
                            "Failed to load Razorpay Checkout."
                        )
                    );

                document.body.appendChild(
                    script
                );
            }
        );
    };

    // =========================================================
    // FORMAT MONEY
    // =========================================================

    const formatMoney = (paise) => {
        return new Intl.NumberFormat(
            "en-IN",
            {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
            }
        ).format(
            (Number(paise) || 0) / 100
        );
    };

    // =========================================================
    // CLEAR LOCAL ORDERS
    // =========================================================

    const clearOrders = () => {
        localStorage.removeItem(
            STORAGE_KEY
        );

        setOrders([]);

        setMessage(
            "Local test orders cleared."
        );
    };

    // =========================================================
    // UI
    // =========================================================

    return (
        <div className="test-payment-page">

            {/* HEADER */}

            <div className="test-payment-header">

                <div>

                    <button
                        className="back-button"
                        onClick={() =>
                            navigate("/overview")
                        }
                    >
                        <ArrowLeft size={16} />

                        Back to Overview
                    </button>

                    <div className="test-payment-title">

                        <div>

                            <h1>
                                Test Payments
                            </h1>

                            <p>
                                Create and test Razorpay
                                payments in Test Mode.
                            </p>

                        </div>

                    </div>

                </div>

                <button
                    className="refresh-button"
                    onClick={() =>
                        window.location.reload()
                    }
                >
                    <RefreshCw size={15} />

                    Refresh
                </button>

            </div>

            {/* TEST MODE INFO */}

            <div className="test-mode-banner">

                <div className="test-mode-icon">
                    <ShieldCheck size={21} />
                </div>

                <div>

                    <strong>
                        Razorpay Test Mode
                    </strong>

                    <p>
                        These payments use Razorpay's
                        sandbox environment. No real
                        money is charged.
                    </p>

                </div>

            </div>

            {/* ERROR */}

            {error && (
                <div className="test-payment-error">

                    <AlertTriangle size={18} />

                    <span>
                        {error}
                    </span>

                    <button
                        onClick={() =>
                            setError("")
                        }
                    >
                        ×
                    </button>

                </div>
            )}

            {/* SUCCESS */}

            {message && (
                <div className="test-payment-success">

                    <CheckCircle2 size={18} />

                    <span>
                        {message}
                    </span>

                </div>
            )}

            {/* CREATE ORDER */}

            <section className="test-payment-card">

                <div className="test-card-header">

                    <div className="test-card-icon">
                        <ShoppingBag size={20} />
                    </div>

                    <div>

                        <h2>
                            Create New Test Order
                        </h2>

                        <p>
                            Create a Razorpay order
                            that can be paid using
                            Test Mode.
                        </p>

                    </div>

                </div>

                <div className="create-order-form">

                    <label>
                        Order Amount
                    </label>

                    <div className="amount-input-wrapper">

                        <IndianRupee size={17} />

                        <input
                            type="number"
                            min="1"
                            value={amount}
                            onChange={(event) =>
                                setAmount(
                                    event.target.value
                                )
                            }
                            placeholder="200"
                        />

                    </div>

                    <button
                        className="create-order-button"
                        onClick={createOrder}
                        disabled={creating}
                    >

                        {creating ? (
                            <>
                                <RefreshCw
                                    size={16}
                                    className="spin"
                                />

                                Creating...
                            </>
                        ) : (
                            <>
                                <ShoppingBag
                                    size={16}
                                />

                                Create Test Order
                            </>
                        )}

                    </button>

                </div>

            </section>

            {/* TEST ORDERS */}

            <section className="test-payment-card">

                <div className="test-card-header">

                    <div className="test-card-icon">
                        <CreditCard size={20} />
                    </div>

                    <div>

                        <h2>
                            Test Orders
                        </h2>

                        <p>
                            Pay an order to generate
                            real Razorpay Test Mode
                            payment events.
                        </p>

                    </div>

                    {orders.length > 0 && (
                        <button
                            className="clear-orders-button"
                            onClick={clearOrders}
                        >
                            Clear
                        </button>
                    )}

                </div>

                {orders.length === 0 ? (

                    <div className="empty-test-orders">

                        <ShoppingBag size={30} />

                        <strong>
                            No test orders yet
                        </strong>

                        <p>
                            Create your first test
                            order above.
                        </p>

                    </div>

                ) : (

                    <div className="test-orders-list">

                        {orders.map((order) => (

                            <div
                                className="test-order-row"
                                key={order.orderId}
                            >

                                <div className="test-order-main">

                                    <div className="test-order-icon">
                                        <ShoppingBag
                                            size={17}
                                        />
                                    </div>

                                    <div>

                                        <strong>
                                            {order.orderId}
                                        </strong>

                                        <span>
                                            Receipt:{" "}
                                            {order.receipt ||
                                                "—"}
                                        </span>

                                    </div>

                                </div>

                                <div className="test-order-amount">

                                    {formatMoney(
                                        order.amount
                                    )}

                                </div>

                                <div>

                                    <span
                                        className={`test-order-status ${order.status}`}
                                    >
                                        {formatStatus(
                                            order.status
                                        )}
                                    </span>

                                </div>

                                <button
                                    className="pay-order-button"
                                    onClick={() =>
                                        payOrder(order)
                                    }
                                    disabled={
                                        payingOrderId ===
                                        order.orderId
                                    }
                                >

                                    {payingOrderId ===
                                        order.orderId ? (
                                        <>
                                            <RefreshCw
                                                size={15}
                                                className="spin"
                                            />

                                            Opening...
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard
                                                size={15}
                                            />

                                            Pay Now
                                        </>
                                    )}

                                </button>

                            </div>

                        ))}

                    </div>

                )}

            </section>

            {/* TEST FLOW */}

            <section className="test-flow-card">

                <div className="test-flow-header">

                    <h2>
                        RIDE Test Flow
                    </h2>

                    <p>
                        Use this page to demonstrate
                        the complete revenue recovery
                        lifecycle.
                    </p>

                </div>

                <div className="test-flow">

                    <FlowStep
                        number="1"
                        title="Create Order"
                    />

                    <div className="flow-arrow">
                        →
                    </div>

                    <FlowStep
                        number="2"
                        title="Pay"
                    />

                    <div className="flow-arrow">
                        →
                    </div>

                    <FlowStep
                        number="3"
                        title="Razorpay Webhook"
                    />

                    <div className="flow-arrow">
                        →
                    </div>

                    <FlowStep
                        number="4"
                        title="RIDE Recovery"
                    />

                </div>

            </section>

        </div>
    );
}

// =============================================================
// HELPERS
// =============================================================

function formatStatus(status) {
    if (!status) {
        return "Created";
    }

    return status
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) =>
            letter.toUpperCase()
        );
}

function FlowStep({
    number,
    title,
}) {
    return (
        <div className="flow-step">

            <div className="flow-number">
                {number}
            </div>

            <span>
                {title}
            </span>

        </div>
    );
}

export default TestPayment;
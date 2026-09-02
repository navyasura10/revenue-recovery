import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    ShieldAlert,
    BrainCircuit,
    FileClock,
    BarChart3,
} from "lucide-react";

const navigation = [
    {
        name: "Overview",
        path: "/overview",
        icon: LayoutDashboard,
    },
    {
        name: "Recovery Cases",
        path: "/recovery-cases",
        icon: ShieldAlert,
    },
    {
        name: "AI Decisions",
        path: "/ai-decisions",
        icon: BrainCircuit,
    },
    {
        name: "Audit Trail",
        path: "/audit-trail",
        icon: FileClock,
    },
    {
        name: "Evaluation",
        path: "/evaluation",
        icon: BarChart3,
    },
];

function Layout() {
    const navigate = useNavigate();

    return (
        <div className="ride-app">

            <aside className="ride-sidebar">

                <div className="ride-brand">
                    <div className="ride-logo">
                        R
                    </div>

                    <div>
                        <div className="ride-name">
                            RIDE
                        </div>

                        <div className="ride-subtitle">
                            Revenue Intelligence
                        </div>
                    </div>
                </div>

                <div className="sidebar-section-title">
                    WORKSPACE
                </div>

                <nav className="ride-navigation">

                    {navigation.map((item) => {

                        const Icon = item.icon;

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `nav-item ${isActive ? "active" : ""
                                    }`
                                }
                            >
                                <Icon size={19} />
                                <span>{item.name}</span>
                            </NavLink>
                        );
                    })}

                </nav>

                <div className="sidebar-footer">

                    <div className="system-status">

                        <span className="status-dot"></span>

                        <div>

                            <div className="status-title">
                                System Operational
                            </div>

                            <div className="status-text">
                                AI + Policy Engine
                            </div>

                        </div>

                    </div>

                </div>

            </aside>

            <main className="ride-main">

                <header className="ride-header">

                    <div>

                        <div className="header-label">
                            REVENUE RECOVERY
                        </div>

                        <div className="header-title">
                            Decision Intelligence
                        </div>

                    </div>

                    <div className="header-right">

                        <button
                            className="test-payment-button"
                            onClick={() => navigate("/test-payment")}
                        >
                            TEST PAYMENT
                        </button>

                    </div>

                </header>

                <section className="ride-content">
                    <Outlet />
                </section>

            </main>

        </div>
    );
}

export default Layout;
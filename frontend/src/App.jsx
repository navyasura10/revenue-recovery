import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";

import Overview from "./pages/Overview";
import RecoveryCases from "./pages/RecoveryCases";
import AIDecisions from "./pages/AIDecisions";
import AuditTrail from "./pages/AuditTrail";
import Evaluation from "./pages/Evaluation";
import RecoveryCaseDetails from "./pages/RecoveryCaseDetails";
import TestPayment from "./pages/TestPayment";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<Overview />} />
          <Route path="/recovery-cases" element={<RecoveryCases />} />
          <Route path="/recovery-cases/:paymentId" element={<RecoveryCaseDetails />} />
          <Route path="/ai-decisions" element={<AIDecisions />} />
          <Route path="/audit-trail" element={<AuditTrail />} />
          <Route path="/evaluation" element={<Evaluation />} />
          <Route path="/test-payment" element={<TestPayment />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
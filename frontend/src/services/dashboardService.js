import axios from "axios";

const API = "http://localhost:8081/api";

export const getDashboardData = async () => {
    const [
        paymentsResponse,
        attemptsResponse,
        decisionsResponse
    ] = await Promise.all([
        axios.get(`${API}/payments`),
        axios.get(`${API}/payment-attempts`),
        axios.get(`${API}/recovery-decisions`)
    ]);

    return {
        payments: paymentsResponse.data,
        attempts: attemptsResponse.data,
        decisions: decisionsResponse.data
    };
};
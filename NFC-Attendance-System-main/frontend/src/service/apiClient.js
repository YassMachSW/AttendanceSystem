import axios from "axios";

const apiClient = axios.create({
baseURL: "https://attendancesystem-3nux.onrender.com",
});

export default apiClient;
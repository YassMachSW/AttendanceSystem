import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.REACTAPPAPIURL || "http://localhost:5000",
});

export default apiClient;
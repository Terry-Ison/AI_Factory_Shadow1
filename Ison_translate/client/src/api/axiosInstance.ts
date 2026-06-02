import axios from "axios";

// ── 1. Create the instance ────────────────────────────────────────────────────
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── 2. Before every request → attach the token ───────────────────────────────
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  return config;
});

// ── 3. After every response → handle expired token (401) ─────────────────────
axiosInstance.interceptors.response.use(
  // Success: just return the response as-is
  (response) => response,

  // Error: if token expired or unauthorized → logout
  (error) => {
    if (error.response?.status === 401) {
      logout();
    }

    return Promise.reject(error);
  }
);

// ── 4. Logout helper ──────────────────────────────────────────────────────────
function logout() {
  localStorage.removeItem("accessToken");
  window.location.href = "/login"; // change path if needed
}

export default axiosInstance;
const AUTH_API_URL = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_AUTH_API_URL)
    ? import.meta.env.VITE_AUTH_API_URL
    : "https://rengofun-auth.onrender.com";

export const authService = {
    // Lấy URL hiện tại đang kết nối
    getApiUrl: () => AUTH_API_URL,

    // Gửi yêu cầu đăng ký
    register: async (username, password) => {
        try {
            const response = await fetch(`${AUTH_API_URL}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || "Đăng ký thất bại");
            }
            return data;
        } catch (err) {
            if (err.message === "Failed to fetch" || err.name === "TypeError") {
                throw new Error("Không thể kết nối đến máy chủ Cloud Auth. Máy chủ miễn phí có thể cần 30-45s để khởi động, vui lòng thử lại!");
            }
            throw err;
        }
    },

    // Gửi yêu cầu đăng nhập và nhận JWT
    login: async (username, password) => {
        try {
            const response = await fetch(`${AUTH_API_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || "Đăng nhập thất bại");
            }
            // Lưu Access Token vào localStorage của máy
            if (data.access_token) {
                localStorage.setItem("rengofun_token", data.access_token);
                localStorage.setItem("rengofun_user", JSON.stringify({
                    username: data.username,
                    plan: data.plan,
                    role: data.role || "user"
                }));
            }
            return data;
        } catch (err) {
            if (err.message === "Failed to fetch" || err.name === "TypeError") {
                throw new Error("Không thể kết nối đến máy chủ Cloud Auth. Máy chủ miễn phí có thể cần 30-45s để khởi động, vui lòng thử lại!");
            }
            throw err;
        }
    },

    // Kiểm tra sức khỏe kết nối Auth API & MongoDB
    checkHealth: async () => {
        try {
            const res = await fetch(`${AUTH_API_URL}/health`, { method: "GET" });
            return res.ok;
        } catch {
            return false;
        }
    },

    // Đăng xuất
    logout: () => {
        localStorage.removeItem("rengofun_token");
        localStorage.removeItem("rengofun_user");
    },

    // Lấy token hiện tại
    getToken: () => localStorage.getItem("rengofun_token"),
};
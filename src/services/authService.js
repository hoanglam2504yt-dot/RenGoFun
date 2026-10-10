const AUTH_API_URL = "https://rengofun-auth.onrender.com";

export const authService = {
    // Gửi yêu cầu đăng ký
    register: async (username, password) => {
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
    },

    // Gửi yêu cầu đăng nhập và nhận JWT
    login: async (username, password) => {
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
                plan: data.plan
            }));
        }
        return data;
    },

    // Đăng xuất
    logout: () => {
        localStorage.removeItem("rengofun_token");
        localStorage.removeItem("rengofun_user");
    },

    // Lấy token hiện tại
    getToken: () => localStorage.getItem("rengofun_token"),
};
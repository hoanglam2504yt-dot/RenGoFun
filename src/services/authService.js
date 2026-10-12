/**
 * authService.js — RenGoFun Cloud Auth Client v3.0
 * Hỗ trợ kiến trúc Hybrid: Email, Captcha 4 ký tự, OTP Gmail, Refresh Token, Quên mật khẩu.
 */

const AUTH_API_URL =
  typeof import.meta !== "undefined" &&
  import.meta.env &&
  import.meta.env.VITE_AUTH_API_URL
    ? import.meta.env.VITE_AUTH_API_URL
    : "https://rengofun-auth.onrender.com";

export const authService = {
  // Lấy URL hiện tại đang kết nối
  getApiUrl: () => AUTH_API_URL,

  // 1. Lấy mã Captcha 4 ký tự ngẫu nhiên
  getCaptcha: async () => {
    try {
      const res = await fetch(`${AUTH_API_URL}/auth/captcha`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Không thể lấy mã captcha");
      return data; // { captcha_id, captcha_text, expires_in_seconds }
    } catch (err) {
      if (err.message === "Failed to fetch" || err.name === "TypeError") {
        throw new Error("Không thể kết nối đến máy chủ Cloud Auth. Vui lòng kiểm tra mạng hoặc thử lại sau 30s!");
      }
      throw err;
    }
  },

  // 2. Đăng ký tài khoản (gửi OTP kích hoạt về Gmail)
  register: async (params, legacyPassword = null) => {
    try {
      let bodyData;
      if (typeof params === "string") {
        // Hỗ trợ legacy: register(username/email, password)
        bodyData = {
          email: params.includes("@") ? params : `${params}@rengofun.com`,
          password: legacyPassword,
        };
        const endpoint = `${AUTH_API_URL}/register`;
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Đăng ký thất bại");
        return data;
      } else {
        // v3.0: register({ email, password, captcha_id, captcha_text })
        const res = await fetch(`${AUTH_API_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Đăng ký thất bại");
        return data;
      }
    } catch (err) {
      if (err.message === "Failed to fetch" || err.name === "TypeError") {
        throw new Error("Không thể kết nối đến máy chủ Cloud Auth.");
      }
      throw err;
    }
  },

  // 3. Kích hoạt tài khoản bằng mã OTP 6 số
  verifyEmail: async (email, otpCode) => {
    try {
      const res = await fetch(`${AUTH_API_URL}/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp_code: otpCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Xác thực mã OTP thất bại");
      return data;
    } catch (err) {
      if (err.message === "Failed to fetch" || err.name === "TypeError") {
        throw new Error("Không thể kết nối đến máy chủ Cloud Auth.");
      }
      throw err;
    }
  },

  // 4. Gửi yêu cầu đăng nhập và nhận Access Token (15p) + Refresh Token (7 ngày)
  login: async (params, legacyPassword = null) => {
    try {
      let payload;
      let endpoint;
      if (typeof params === "string") {
        payload = { email: params, password: legacyPassword };
        endpoint = `${AUTH_API_URL}/login`;
      } else {
        payload = params;
        endpoint = `${AUTH_API_URL}/auth/login`;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Đăng nhập thất bại");

      // Lưu trữ phiên đăng nhập an toàn
      if (data.access_token) {
        localStorage.setItem("rengofun_token", data.access_token);
        if (data.refresh_token) {
          localStorage.setItem("rengofun_refresh_token", data.refresh_token);
        }
        localStorage.setItem(
          "rengofun_user",
          JSON.stringify({
            id: data.user?.id,
            email: data.user?.email,
            username: data.username || data.user?.username,
            role: data.role || data.user?.role || "free",
            plan: data.plan || data.user?.plan || "free",
            preferences: data.user?.preferences || {},
          })
        );
      }
      return data;
    } catch (err) {
      if (err.message === "Failed to fetch" || err.name === "TypeError") {
        throw new Error("Không thể kết nối đến máy chủ Cloud Auth. Máy chủ miễn phí có thể cần 30-45s để khởi động, vui lòng thử lại!");
      }
      throw err;
    }
  },

  // 5. Cấp lại Access Token bằng Refresh Token
  refreshToken: async () => {
    try {
      const refreshToken = localStorage.getItem("rengofun_refresh_token");
      if (!refreshToken) return null;

      const res = await fetch(`${AUTH_API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      const data = await res.json();
      if (res.ok && data.access_token) {
        localStorage.setItem("rengofun_token", data.access_token);
        return data.access_token;
      } else {
        // Refresh Token hết hạn -> Buộc đăng xuất
        authService.logout();
        return null;
      }
    } catch {
      return null;
    }
  },

  // 6. Gửi yêu cầu quên mật khẩu (chờ Admin duyệt)
  forgotPassword: async ({ email, captcha_id, captcha_text }) => {
    try {
      const res = await fetch(`${AUTH_API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, captcha_id, captcha_text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Gửi yêu cầu thất bại");
      return data;
    } catch (err) {
      if (err.message === "Failed to fetch" || err.name === "TypeError") {
        throw new Error("Không thể kết nối đến máy chủ Cloud Auth.");
      }
      throw err;
    }
  },

  // 7. Kiểm tra trạng thái máy chủ
  checkHealth: async () => {
    try {
      const res = await fetch(`${AUTH_API_URL}/health`, { method: "GET" });
      return res.ok;
    } catch {
      return false;
    }
  },

  // 8. Đăng xuất và thu hồi Refresh Token
  logout: async () => {
    const refreshToken = localStorage.getItem("rengofun_refresh_token");
    if (refreshToken) {
      fetch(`${AUTH_API_URL}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      }).catch(() => {});
    }
    localStorage.removeItem("rengofun_token");
    localStorage.removeItem("rengofun_refresh_token");
    localStorage.removeItem("rengofun_user");
  },

  // 9. Lấy Token & User hiện tại
  getToken: () => localStorage.getItem("rengofun_token"),
  getRefreshToken: () => localStorage.getItem("rengofun_refresh_token"),
  getCurrentUser: () => {
    try {
      return JSON.parse(localStorage.getItem("rengofun_user") || "null");
    } catch {
      return null;
    }
  },
};
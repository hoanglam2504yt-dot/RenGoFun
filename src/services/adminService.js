/**
 * adminService.js — RenGoFun Admin API Client v2.0
 * Gọi tất cả endpoint /api/admin/* với JWT Bearer tự động.
 */

const AUTH_API_URL =
  typeof import.meta !== "undefined" &&
  import.meta.env &&
  import.meta.env.VITE_AUTH_API_URL
    ? import.meta.env.VITE_AUTH_API_URL
    : "https://rengofun-auth.onrender.com";

const BASE = `${AUTH_API_URL}/api/admin`;

// ─── Helper: tự động đính kèm Bearer Token ───────────────────────────────────
function authHeaders() {
  const token = localStorage.getItem("rengofun_token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function _fetch(url, options = {}) {
  const res = await fetch(url, { ...options, headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.detail || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

// ─── API Calls ────────────────────────────────────────────────────────────────
export const adminService = {
  /** 1. Lấy KPI metrics cho Dashboard */
  getMetrics: () => _fetch(`${BASE}/metrics`),

  /** 2. Lấy danh sách người dùng có phân trang & tìm kiếm */
  getUsers: ({ page = 1, limit = 20, search = "", plan = "", status = "" } = {}) => {
    const params = new URLSearchParams({ page, limit });
    if (search) params.append("search", search);
    if (plan && plan !== "all") params.append("plan", plan);
    if (status && status !== "all") params.append("status", status);
    return _fetch(`${BASE}/users?${params}`);
  },

  /** 3. Khóa / Mở khóa tài khoản */
  updateUserStatus: (username, isActive, reason = "") =>
    _fetch(`${BASE}/users/${username}/status`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: isActive, reason }),
    }),

  /** 4. Cập nhật gói bản quyền */
  updateUserPlan: (username, plan, durationDays = 30) =>
    _fetch(`${BASE}/users/${username}/plan`, {
      method: "PATCH",
      body: JSON.stringify({ plan, duration_days: durationDays }),
    }),

  /** 5. Buộc đăng xuất khỏi tất cả thiết bị */
  revokeSessions: (username) =>
    _fetch(`${BASE}/users/${username}/revoke-sessions`, { method: "POST" }),

  /** 6. Lấy danh sách phiên làm việc */
  getSessions: (userId = "") => {
    const params = userId ? `?user_id=${userId}` : "";
    return _fetch(`${BASE}/sessions${params}`);
  },

  /** 7. Lấy nhật ký an ninh */
  getAuditLogs: ({ page = 1, limit = 50, actionType = "" } = {}) => {
    const params = new URLSearchParams({ page, limit });
    if (actionType && actionType !== "all") params.append("action_type", actionType);
    return _fetch(`${BASE}/audit-logs?${params}`);
  },

  /** 8. Gửi broadcast cấu hình hệ thống */
  broadcastSystem: ({ minVersion, bannerMsg, maintenanceMode } = {}) =>
    _fetch(`${BASE}/system/broadcast`, {
      method: "POST",
      body: JSON.stringify({
        min_version: minVersion,
        banner_msg: bannerMsg,
        maintenance_mode: maintenanceMode,
      }),
    }),

  /** 9. Lấy cấu hình hệ thống hiện tại */
  getSystemConfig: () => _fetch(`${BASE}/system/config`),
};

/**
 * SecurityLogViewer.jsx — Nhật ký an ninh & kiểm toán Admin Dashboard
 * Đồng bộ với admin.css và chuẩn UI thiết kế của dự án
 */
import { useState, useEffect } from "react";
import {
  ShieldAlert, RefreshCw, AlertTriangle,
  Filter, CheckCircle, Clock, ChevronLeft, ChevronRight
} from "lucide-react";
import { adminService } from "../../services/adminService";

const ACTION_MAP = {
  login_success:         { label: "Đăng nhập thành công", color: "#34d399", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)" },
  login_failed:          { label: "Đăng nhập thất bại",   color: "#f87171", bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.25)" },
  token_refreshed:       { label: "Làm mới Token",        color: "#818cf8", bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.25)" },
  admin_action:          { label: "Hành động Admin",      color: "#fbbf24", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)" },
  admin_ban_user:        { label: "Khóa người dùng",      color: "#f87171", bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.25)" },
  admin_unban_user:      { label: "Mở khóa tài khoản",    color: "#34d399", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)" },
  admin_change_plan:     { label: "Cập nhật gói",         color: "#22d3ee", bg: "rgba(6,182,212,0.12)",  border: "rgba(6,182,212,0.25)" },
  admin_revoke_sessions: { label: "Hủy phiên đăng nhập",  color: "#fbbf24", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)" },
};

function EventBadge({ action }) {
  const item = ACTION_MAP[action] || {
    label: action,
    color: "var(--text-muted)",
    bg: "rgba(255,255,255,0.05)",
    border: "var(--border)",
  };

  return (
    <span
      className="admin-badge"
      style={{
        background: item.bg,
        border: `1px solid ${item.border}`,
        color: item.color,
      }}
    >
      {item.label}
    </span>
  );
}

export default function SecurityLogViewer() {
  const [data, setData]         = useState({ logs: [], total: 0, brute_force_alerts: [] });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [page, setPage]         = useState(1);
  const [actionType, setAction] = useState("all");

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getAuditLogs({ page, limit: 20, actionType });
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionType]);

  const totalPages = Math.ceil((data.total || 0) / 20) || 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ── Brute-force Warning Alert Banner ── */}
      {data.brute_force_alerts?.length > 0 && (
        <div style={{
          background: "rgba(239, 68, 68, 0.08)",
          border: "1px solid rgba(239, 68, 68, 0.25)",
          borderRadius: 12,
          padding: "14px 18px",
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
        }}>
          <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: "var(--fs-sm, 0.6875rem)", fontWeight: "var(--fw-label, 560)", color: "#f87171", marginBottom: 4 }}>
              Cảnh báo: Phát hiện {data.brute_force_alerts.length} địa chỉ IP có dấu hiệu dò quét mật khẩu (Brute-force)
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 6 }}>
              {data.brute_force_alerts.map((alert) => (
                <div
                  key={alert._id}
                  style={{
                    fontSize: "var(--fs-xs, 0.625rem)",
                    background: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    padding: "3px 8px",
                    borderRadius: 6,
                    color: "#fca5a5",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  IP: <strong>{alert._id}</strong> ({alert.count} lần thất bại trong 15 phút)
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Main Log Panel ── */}
      <div className="admin-card">
        {/* Header & Filter */}
        <div className="admin-card__header">
          <div>
            <div className="admin-card__title">
              <ShieldAlert size={16} color="var(--accent-2, #818cf8)" />
              <span>Nhật Ký An Ninh & Kiểm Toán Hệ Thống</span>
            </div>
            <div className="admin-card__sub">
              Lưu vết thời gian thực mọi tác vụ đăng nhập và can thiệp quản trị
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Filter */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Filter size={13} color="var(--text-muted)" />
              <select
                value={actionType}
                onChange={e => { setAction(e.target.value); setPage(1); }}
                className="admin-select"
              >
                <option value="all">Tất cả sự kiện</option>
                <option value="login_success">Đăng nhập thành công</option>
                <option value="login_failed">Đăng nhập thất bại</option>
                <option value="admin_ban_user">Admin khóa user</option>
                <option value="admin_unban_user">Admin mở khóa user</option>
                <option value="admin_change_plan">Admin đổi gói</option>
                <option value="admin_revoke_sessions">Admin hủy phiên</option>
              </select>
            </div>

            {/* Refresh */}
            <button
              onClick={fetchLogs}
              className="admin-btn-action"
              title="Làm mới log"
            >
              <RefreshCw size={12} style={loading ? { animation: "spin 1s linear infinite" } : {}} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Thời Gian</th>
                <th>Sự Kiện</th>
                <th>Tài Khoản</th>
                <th>Địa Chỉ IP</th>
                <th>Chi Tiết & Tham Số</th>
              </tr>
            </thead>
            <tbody>
              {loading && data.logs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "36px 0", color: "var(--text-muted)" }}>
                    <RefreshCw size={16} style={{ animation: "spin 1s linear infinite", display: "inline-block", marginRight: 8 }} />
                    Đang tải nhật ký kiểm toán...
                  </td>
                </tr>
              ) : data.logs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "36px 0", color: "var(--text-muted)" }}>
                    Không có bản ghi nhật ký phù hợp.
                  </td>
                </tr>
              ) : (
                data.logs.map((log, i) => (
                  <tr key={log._id || i}>
                    <td style={{ color: "var(--text-muted)", fontSize: "var(--fs-xs, 0.625rem)", whiteSpace: "nowrap" }}>
                      {log.timestamp ? new Date(log.timestamp).toLocaleString("vi-VN") : "—"}
                    </td>

                    <td>
                      <EventBadge action={log.action} />
                    </td>

                    <td style={{ fontWeight: "var(--fw-label, 560)" }}>
                      {log.username || "—"}
                    </td>

                    <td style={{ color: "var(--text-secondary)", fontFamily: "monospace", fontSize: "var(--fs-xs, 0.625rem)" }}>
                      {log.ip_address || "—"}
                    </td>

                    <td style={{ color: "var(--text-secondary)", fontSize: "var(--fs-xs, 0.625rem)", maxWidth: 300, wordBreak: "break-word" }}>
                      {typeof log.details === "object" ? JSON.stringify(log.details) : (log.details || "—")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="admin-pagination">
          <span>
            Trang <strong style={{ color: "var(--text-primary)" }}>{page}</strong> trên <strong style={{ color: "var(--text-primary)" }}>{totalPages}</strong> (Tổng {data.total || 0} bản ghi)
          </span>

          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="admin-pagination__btn"
            >
              <ChevronLeft size={13} />
              <span>Trước</span>
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="admin-pagination__btn"
            >
              <span>Sau</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}

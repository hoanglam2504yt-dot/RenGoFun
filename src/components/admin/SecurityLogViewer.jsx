/**
 * SecurityLogViewer.jsx — Nhật ký an ninh & kiểm toán Admin Dashboard
 */
import { useState, useEffect } from "react";
import { ShieldAlert, RefreshCw, AlertTriangle, Filter } from "lucide-react";
import { adminService } from "../../services/adminService";

const ACTION_COLORS = {
  login_success:      { color: "#10b981", bg: "rgba(16,185,129,0.12)", label: "Đăng nhập thành công" },
  login_failed:       { color: "#ef4444", bg: "rgba(239,68,68,0.12)",  label: "Đăng nhập thất bại" },
  token_refreshed:    { color: "#6366f1", bg: "rgba(99,102,241,0.12)", label: "Làm mới token" },
  admin_action:       { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: "Hành động Admin" },
  admin_ban_user:     { color: "#ef4444", bg: "rgba(239,68,68,0.12)",  label: "Admin khóa user" },
  admin_unban_user:   { color: "#10b981", bg: "rgba(16,185,129,0.12)", label: "Admin mở khóa user" },
  admin_change_plan:  { color: "#06b6d4", bg: "rgba(6,182,212,0.12)", label: "Admin đổi gói" },
  admin_revoke_sessions: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: "Admin thu hồi phiên" },
};

function getActionStyle(action) {
  return ACTION_COLORS[action] || { color: "#94a3b8", bg: "rgba(148,163,184,0.1)", label: action };
}

export default function SecurityLogViewer() {
  const [data, setData]       = useState({ logs: [], total: 0, brute_force_alerts: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [page, setPage]       = useState(1);
  const [actionType, setAction] = useState("all");

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getAuditLogs({ page, limit: 50, actionType });
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [page, actionType]);

  const cellStyle = { padding: "10px 14px", fontSize: "0.7rem", borderBottom: "1px solid rgba(255,255,255,0.04)", verticalAlign: "middle" };

  return (
    <div>
      {/* ── Brute-force Alerts ── */}
      {data.brute_force_alerts?.length > 0 && (
        <div style={{
          background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
          borderRadius: 10, padding: "12px 16px", marginBottom: 16,
          display: "flex", alignItems: "flex-start", gap: 10,
        }}>
          <AlertTriangle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#ef4444", marginBottom: 4 }}>
              ⚠️ Phát hiện {data.brute_force_alerts.length} IP tấn công Brute-force!
            </div>
            {data.brute_force_alerts.map(alert => (
              <div key={alert._id} style={{ fontSize: "0.68rem", color: "#fca5a5", marginTop: 2 }}>
                IP <strong>{alert._id}</strong>: {alert.count} lần thất bại
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Toolbar ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
        <Filter size={13} color="var(--text-secondary)" />
        <select
          value={actionType}
          onChange={e => { setAction(e.target.value); setPage(1); }}
          style={{ padding: "7px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, color: "#e2e8f0", fontSize: "0.72rem" }}
        >
          <option value="all">Tất cả sự kiện</option>
          <option value="login_success">Đăng nhập thành công</option>
          <option value="login_failed">Đăng nhập thất bại</option>
          <option value="admin_ban_user">Admin khóa user</option>
          <option value="admin_change_plan">Admin đổi gói</option>
          <option value="admin_revoke_sessions">Admin thu hồi phiên</option>
        </select>
        <button
          onClick={fetchLogs}
          style={{
            padding: "7px 12px", borderRadius: 9, border: "1px solid rgba(99,102,241,0.3)",
            background: "rgba(99,102,241,0.1)", color: "#6366f1", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 5, fontSize: "0.72rem",
          }}
        >
          <RefreshCw size={12} style={loading ? { animation: "spin 1s linear infinite" } : {}} />
          Làm mới
        </button>
        <span style={{ marginLeft: "auto", fontSize: "0.68rem", color: "var(--text-secondary)" }}>
          Tổng {data.total} bản ghi
        </span>
      </div>

      {/* ── Log Table ── */}
      <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
        {error && (
          <div style={{ padding: "10px 14px", color: "#ef4444", fontSize: "0.72rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            ⚠️ {error}
          </div>
        )}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.03)" }}>
              {["Thời gian", "Sự kiện", "Username / Admin", "IP Address", "HTTP Status"].map(h => (
                <th key={h} style={{
                  padding: "10px 14px", fontSize: "0.62rem", color: "#94a3b8", fontWeight: 700,
                  textAlign: "left", textTransform: "uppercase", letterSpacing: "0.05em",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ ...cellStyle, textAlign: "center", padding: 32, color: "var(--text-secondary)" }}>
                  <RefreshCw size={16} style={{ animation: "spin 1s linear infinite", display: "inline-block" }} />
                  <div style={{ marginTop: 6, fontSize: "0.72rem" }}>Đang tải nhật ký...</div>
                </td>
              </tr>
            ) : data.logs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ ...cellStyle, textAlign: "center", padding: 28, color: "var(--text-secondary)", fontSize: "0.72rem" }}>
                  <ShieldAlert size={20} style={{ display: "block", margin: "0 auto 6px" }} />
                  Không có nhật ký nào
                </td>
              </tr>
            ) : (
              data.logs.map((log, i) => {
                const style = getActionStyle(log.action);
                return (
                  <tr
                    key={i}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(99,102,241,0.04)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    style={{ transition: "background 0.15s" }}
                  >
                    <td style={{ ...cellStyle, color: "#94a3b8", fontSize: "0.68rem", whiteSpace: "nowrap" }}>
                      {log.timestamp ? new Date(log.timestamp).toLocaleString("vi-VN") : "—"}
                    </td>
                    <td style={cellStyle}>
                      <span style={{
                        padding: "3px 8px", borderRadius: 6, fontSize: "0.62rem", fontWeight: 700,
                        background: style.bg, color: style.color,
                      }}>
                        {style.label}
                      </span>
                    </td>
                    <td style={{ ...cellStyle, color: "#c7d2fe", fontWeight: 600, fontSize: "0.7rem" }}>
                      {log.username || log.performed_by_admin || log.target_user || "—"}
                      {log.target_user && log.performed_by_admin && (
                        <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>
                          {" "}→ {log.target_user}
                        </span>
                      )}
                    </td>
                    <td style={{ ...cellStyle, color: "#94a3b8", fontFamily: "monospace", fontSize: "0.68rem" }}>
                      {log.ip_address || "—"}
                    </td>
                    <td style={cellStyle}>
                      {log.http_status ? (
                        <span style={{
                          padding: "2px 7px", borderRadius: 5, fontSize: "0.62rem", fontWeight: 700,
                          background: log.http_status < 300 ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                          color: log.http_status < 300 ? "#10b981" : "#ef4444",
                        }}>
                          {log.http_status}
                        </span>
                      ) : "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data.total_pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 12 }}>
          {Array.from({ length: Math.min(data.total_pages, 5) }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                width: 30, height: 30, borderRadius: 7,
                background: page === p ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${page === p ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.1)"}`,
                color: page === p ? "#818cf8" : "#94a3b8",
                cursor: "pointer", fontSize: "0.72rem", fontWeight: 600,
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

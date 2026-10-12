/**
 * UserTable.jsx — Bảng danh sách tài khoản Admin Dashboard
 */
import { useState, useEffect, useCallback } from "react";
import { Search, Filter, ChevronLeft, ChevronRight, Edit3, RefreshCw } from "lucide-react";
import { adminService } from "../../services/adminService";
import UserEditModal from "./UserEditModal";

const PLAN_BADGE = {
  free:       { label: "Free",       bg: "rgba(156,163,175,0.15)", color: "#9ca3af", border: "#9ca3af30" },
  pro:        { label: "Pro",        bg: "rgba(6,182,212,0.15)",   color: "#06b6d4", border: "#06b6d430" },
  enterprise: { label: "Enterprise", bg: "rgba(245,158,11,0.15)",  color: "#f59e0b", border: "#f59e0b30" },
};

function PlanBadge({ plan }) {
  const b = PLAN_BADGE[plan] || PLAN_BADGE.free;
  return (
    <span style={{
      padding: "3px 9px", borderRadius: 20, fontSize: "0.62rem", fontWeight: 700,
      background: b.bg, color: b.color, border: `1px solid ${b.border}`,
    }}>
      {b.label}
    </span>
  );
}

function StatusBadge({ isActive }) {
  return (
    <span style={{
      display: "flex", alignItems: "center", gap: 5,
      fontSize: "0.65rem", fontWeight: 600,
      color: isActive ? "#10b981" : "#ef4444",
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: isActive ? "#10b981" : "#ef4444",
        boxShadow: `0 0 6px ${isActive ? "#10b981" : "#ef4444"}`,
      }} />
      {isActive ? "Hoạt động" : "Đã khóa"}
    </span>
  );
}

export default function UserTable() {
  const [data, setData]           = useState({ users: [], total: 0, total_pages: 1 });
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [editUser, setEditUser]   = useState(null);

  // Filters
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState("");
  const [planFilter, setPlan]     = useState("all");
  const [statusFilter, setStatus] = useState("all");
  const [searchInput, setSearchInput] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getUsers({ page, limit: 20, search, plan: planFilter, status: statusFilter });
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, planFilter, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const colStyle = {
    padding: "10px 14px", fontSize: "0.7rem", color: "var(--text-secondary)",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  };
  const cellStyle = {
    padding: "11px 14px", fontSize: "0.73rem", color: "#e2e8f0",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    verticalAlign: "middle",
  };

  return (
    <div>
      {/* ── Toolbar ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Tìm theo username / email..."
            style={{
              width: "100%", padding: "8px 10px 8px 32px",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 9, color: "#fff", fontSize: "0.73rem", boxSizing: "border-box",
            }}
          />
        </div>

        {/* Plan filter */}
        <select
          value={planFilter}
          onChange={e => { setPlan(e.target.value); setPage(1); }}
          style={{ padding: "8px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, color: "#e2e8f0", fontSize: "0.73rem" }}
        >
          <option value="all">Tất cả gói</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          style={{ padding: "8px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, color: "#e2e8f0", fontSize: "0.73rem" }}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="banned">Đã khóa</option>
        </select>

        {/* Refresh */}
        <button
          onClick={fetchUsers}
          style={{
            padding: "8px 12px", borderRadius: 9, border: "1px solid rgba(99,102,241,0.3)",
            background: "rgba(99,102,241,0.1)", color: "#6366f1", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 5, fontSize: "0.72rem",
          }}
        >
          <RefreshCw size={12} style={loading ? { animation: "spin 1s linear infinite" } : {}} />
          Làm mới
        </button>
      </div>

      {/* ── Table ── */}
      <div style={{
        background: "rgba(255,255,255,0.02)", borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden",
      }}>
        {error && (
          <div style={{ padding: "12px 16px", color: "#ef4444", fontSize: "0.75rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            ⚠️ {error}
          </div>
        )}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.03)" }}>
              {["Username", "Email", "Gói cước", "Trạng thái", "Ngày tạo", "Hành động"].map(h => (
                <th key={h} style={{ ...colStyle, fontWeight: 700, color: "#94a3b8", textAlign: "left", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.62rem" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ ...cellStyle, textAlign: "center", padding: 32, color: "var(--text-secondary)" }}>
                  <RefreshCw size={18} style={{ animation: "spin 1s linear infinite", display: "inline-block" }} />
                  <div style={{ marginTop: 8, fontSize: "0.72rem" }}>Đang tải...</div>
                </td>
              </tr>
            ) : data.users.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ ...cellStyle, textAlign: "center", padding: 32, color: "var(--text-secondary)", fontSize: "0.75rem" }}>
                  Không tìm thấy người dùng nào
                </td>
              </tr>
            ) : (
              data.users.map((u) => (
                <tr
                  key={u._id || u.username}
                  style={{ transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(99,102,241,0.05)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ ...cellStyle, fontWeight: 700, color: "#c7d2fe" }}>{u.username}</td>
                  <td style={cellStyle}>{u.email || <span style={{ color: "var(--text-secondary)", fontSize: "0.65rem" }}>—</span>}</td>
                  <td style={cellStyle}><PlanBadge plan={u.plan} /></td>
                  <td style={cellStyle}><StatusBadge isActive={u.is_active !== false} /></td>
                  <td style={cellStyle}>
                    {u.created_at ? new Date(u.created_at).toLocaleDateString("vi-VN") : "—"}
                  </td>
                  <td style={cellStyle}>
                    <button
                      onClick={() => setEditUser(u)}
                      style={{
                        display: "flex", alignItems: "center", gap: 5,
                        padding: "5px 10px", borderRadius: 7,
                        background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)",
                        color: "#818cf8", cursor: "pointer", fontSize: "0.65rem", fontWeight: 600,
                      }}
                    >
                      <Edit3 size={11} />
                      Chỉnh sửa
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {data.total_pages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
          <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
            Tổng {data.total} người dùng · Trang {page}/{data.total_pages}
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              style={{
                padding: "5px 10px", borderRadius: 7,
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                color: page <= 1 ? "var(--text-secondary)" : "#e2e8f0",
                cursor: page <= 1 ? "not-allowed" : "pointer", display: "flex",
              }}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              disabled={page >= data.total_pages}
              onClick={() => setPage(p => p + 1)}
              style={{
                padding: "5px 10px", borderRadius: 7,
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                color: page >= data.total_pages ? "var(--text-secondary)" : "#e2e8f0",
                cursor: page >= data.total_pages ? "not-allowed" : "pointer", display: "flex",
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Modal chỉnh sửa */}
      {editUser && (
        <UserEditModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onRefresh={fetchUsers}
        />
      )}
    </div>
  );
}

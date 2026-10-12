/**
 * UserTable.jsx — Bảng danh sách tài khoản Admin Dashboard
 * Đồng bộ với admin.css và chuẩn UI thiết kế của dự án
 */
import { useState, useEffect, useCallback } from "react";
import {
  Search, Filter, ChevronLeft, ChevronRight,
  Edit3, RefreshCw, AlertCircle, Shield
} from "lucide-react";
import { adminService } from "../../services/adminService";
import UserEditModal from "./UserEditModal";

function PlanBadge({ plan }) {
  const p = (plan || "free").toLowerCase();
  if (p === "pro") {
    return <span className="admin-badge admin-badge--pro">Pro</span>;
  }
  if (p === "enterprise") {
    return <span className="admin-badge admin-badge--enterprise">Enterprise</span>;
  }
  return <span className="admin-badge admin-badge--free">Free</span>;
}

function StatusBadge({ isActive }) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontSize: "var(--fs-xs, 0.625rem)",
      fontWeight: "var(--fw-label, 560)",
      color: isActive ? "#34d399" : "#f87171",
      fontVariantNumeric: "tabular-nums",
    }}>
      <span className="live-dot" style={{
        background: isActive ? "#34d399" : "#f87171",
        boxShadow: `0 0 6px ${isActive ? "rgba(52,211,153,0.7)" : "rgba(248,113,113,0.7)"}`,
        animation: isActive ? "pulse 2s infinite" : "none",
      }} />
      {isActive ? "Hoạt động" : "Bị khóa"}
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
      const res = await adminService.getUsers({
        page,
        limit: 15,
        search,
        plan: planFilter,
        status: statusFilter,
      });
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, planFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  return (
    <div className="admin-card">

      {/* ── Header & Toolbar ── */}
      <div className="admin-card__header">
        <div>
          <div className="admin-card__title">
            <Shield size={16} color="var(--accent-2, #818cf8)" />
            <span>Danh Sách Tài Khoản Người Dùng ({data.total})</span>
          </div>
          <div className="admin-card__sub">
            Tra cứu và kiểm soát quyền hạn tài khoản trên toàn hệ thống
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Search Input */}
          <div style={{ position: "relative", minWidth: 220 }}>
            <Search
              size={13}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Tìm theo username hoặc email..."
              className="admin-input"
              style={{ width: "100%", paddingLeft: 30 }}
            />
          </div>

          {/* Plan Filter */}
          <select
            value={planFilter}
            onChange={e => { setPlan(e.target.value); setPage(1); }}
            className="admin-select"
          >
            <option value="all">Tất cả gói</option>
            <option value="free">Gói Free</option>
            <option value="pro">Gói Pro</option>
            <option value="enterprise">Gói Enterprise</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="admin-select"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="banned">Đã bị khóa</option>
          </select>

          {/* Refresh button */}
          <button
            onClick={fetchUsers}
            className="admin-btn-action"
            title="Tải lại bảng"
          >
            <RefreshCw size={12} style={loading ? { animation: "spin 1s linear infinite" } : {}} />
          </button>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div style={{
          padding: "12px 16px",
          background: "rgba(239,68,68,0.1)",
          borderBottom: "1px solid rgba(239,68,68,0.2)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: "#f87171",
          fontSize: "var(--fs-sm, 0.6875rem)",
        }}>
          <AlertCircle size={14} />
          <span>Lỗi tải dữ liệu: {error}</span>
        </div>
      )}

      {/* ── Table Container ── */}
      <div style={{ overflowX: "auto" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Người Dùng</th>
              <th>Email</th>
              <th>Vai Trò</th>
              <th>Gói Bản Quyền</th>
              <th>Trạng Thái</th>
              <th>Ngày Tạo</th>
              <th style={{ textAlign: "right" }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {loading && data.users.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "36px 0", color: "var(--text-muted)" }}>
                  <RefreshCw size={16} style={{ animation: "spin 1s linear infinite", display: "inline-block", marginRight: 8 }} />
                  Đang tải danh sách người dùng...
                </td>
              </tr>
            ) : data.users.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "36px 0", color: "var(--text-muted)" }}>
                  Không tìm thấy người dùng phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              data.users.map((u) => {
                const isAdmin = u.role === "admin";
                const isBanned = !u.is_active;

                return (
                  <tr key={u.username}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: isAdmin ? "linear-gradient(135deg, #6366f1, #a855f7)" : "rgba(255,255,255,0.06)",
                          border: `1px solid ${isAdmin ? "rgba(99,102,241,0.5)" : "var(--border)"}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "0.68rem",
                          color: "#fff",
                          flexShrink: 0,
                        }}>
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: "var(--fw-label, 560)", color: isBanned ? "var(--text-muted)" : "var(--text-primary)" }}>
                            {u.username}
                          </div>
                          {u.full_name && (
                            <div style={{ fontSize: "var(--fs-xs, 0.625rem)", color: "var(--text-muted)" }}>
                              {u.full_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td style={{ color: "var(--text-secondary)" }}>
                      {u.email || "—"}
                    </td>

                    <td>
                      {isAdmin ? (
                        <span className="admin-badge admin-badge--role">Admin</span>
                      ) : (
                        <span style={{ fontSize: "var(--fs-xs, 0.625rem)", color: "var(--text-muted)" }}>User</span>
                      )}
                    </td>

                    <td>
                      <PlanBadge plan={u.plan} />
                    </td>

                    <td>
                      <StatusBadge isActive={u.is_active} />
                    </td>

                    <td style={{ color: "var(--text-muted)", fontSize: "var(--fs-xs, 0.625rem)" }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString("vi-VN") : "—"}
                    </td>

                    <td style={{ textAlign: "right" }}>
                      <button
                        onClick={() => setEditUser(u)}
                        className="admin-btn-action"
                        title="Chỉnh sửa tài khoản"
                      >
                        <Edit3 size={12} />
                        <span>Chỉnh sửa</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      <div className="admin-pagination">
        <span>
          Trang <strong style={{ color: "var(--text-primary)" }}>{page}</strong> trên <strong style={{ color: "var(--text-primary)" }}>{data.total_pages || 1}</strong> (Tổng {data.total} tài khoản)
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
            onClick={() => setPage(p => Math.min(data.total_pages, p + 1))}
            disabled={page >= data.total_pages || loading}
            className="admin-pagination__btn"
          >
            <span>Sau</span>
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* ── Edit Modal ── */}
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

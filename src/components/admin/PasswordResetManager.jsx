/**
 * PasswordResetManager.jsx — Quản lý phê duyệt yêu cầu cấp lại mật khẩu
 * Theo thiết kế luồng 3.3 trong Update_Auth_Database_Design.md
 */
import { useState, useEffect, useCallback } from "react";
import {
  KeyRound, CheckCircle2, XCircle, Clock, RefreshCw,
  AlertCircle, ShieldAlert, Mail, Send
} from "lucide-react";
import { adminService } from "../../services/adminService";

export default function PasswordResetManager() {
  const [resets, setResets]         = useState([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(false);
  const [actionLoading, setAction]  = useState(null); // id đang xử lý
  const [statusFilter, setStatus]   = useState("pending");
  const [error, setError]           = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [rejectModal, setReject]    = useState(null); // { id, email }
  const [rejectNote, setRejectNote] = useState("");

  const fetchResets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getPasswordResets({ status: statusFilter, limit: 50 });
      setResets(res.resets || []);
      setTotal(res.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchResets();
  }, [fetchResets]);

  // Phê duyệt yêu cầu
  const handleApprove = async (id, email) => {
    if (!window.confirm(`Xác nhận phê duyệt và sinh mật khẩu mới gửi về Gmail cho: ${email}?`)) {
      return;
    }
    setAction(id);
    setError(null);
    setSuccessMsg("");
    try {
      const res = await adminService.approvePasswordReset(id);
      setSuccessMsg(res.message || `Đã gửi mật khẩu mới tới ${email}!`);
      fetchResets();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setAction(null);
    }
  };

  // Từ chối yêu cầu
  const handleRejectConfirm = async () => {
    if (!rejectModal) return;
    setAction(rejectModal.id);
    setError(null);
    try {
      await adminService.rejectPasswordReset(rejectModal.id, rejectNote);
      setSuccessMsg(`Đã từ chối yêu cầu của ${rejectModal.email}`);
      setReject(null);
      setRejectNote("");
      fetchResets();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setAction(null);
    }
  };

  return (
    <div className="admin-card">
      {/* ── Header ── */}
      <div className="admin-card__header">
        <div>
          <div className="admin-card__title">
            <KeyRound size={16} color="var(--accent-2, #818cf8)" />
            <span>Yêu Cầu Cấp Lại Mật Khẩu Chờ Duyệt ({total})</span>
          </div>
          <div className="admin-card__sub">
            Admin kiểm tra định danh và phê duyệt cấp mật khẩu ngẫu nhiên trực tiếp về hộp thư Gmail người dùng
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatus(e.target.value)}
            className="admin-select"
          >
            <option value="pending">Đang chờ duyệt (Pending)</option>
            <option value="approved">Đã phê duyệt (Approved)</option>
            <option value="rejected">Đã từ chối (Rejected)</option>
            <option value="all">Tất cả trạng thái</option>
          </select>

          {/* Refresh button */}
          <button
            onClick={fetchResets}
            className="admin-btn-action"
            title="Tải lại danh sách"
          >
            <RefreshCw size={12} style={loading ? { animation: "spin 1s linear infinite" } : {}} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* ── Messages ── */}
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
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div style={{
          padding: "12px 16px",
          background: "rgba(34,197,94,0.1)",
          borderBottom: "1px solid rgba(34,197,94,0.2)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: "#4ade80",
          fontSize: "var(--fs-sm, 0.6875rem)",
        }}>
          <CheckCircle2 size={14} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ── Table ── */}
      <div style={{ overflowX: "auto" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Email Người Dùng</th>
              <th>Mã Yêu Cầu</th>
              <th>Thời Điểm Gửi</th>
              <th>Trạng Thái</th>
              <th>Ghi Chú Admin</th>
              <th style={{ textAlign: "right" }}>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {loading && resets.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "36px 0", color: "var(--text-muted)" }}>
                  <RefreshCw size={16} style={{ animation: "spin 1s linear infinite", display: "inline-block", marginRight: 8 }} />
                  Đang tải danh sách yêu cầu...
                </td>
              </tr>
            ) : resets.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "36px 0", color: "var(--text-muted)" }}>
                  Không có yêu cầu cấp lại mật khẩu nào ở trạng thái này.
                </td>
              </tr>
            ) : (
              resets.map((r) => {
                const isPending = r.status === "pending";
                const isApproved = r.status === "approved";
                const isRejected = r.status === "rejected";
                const isActionLoading = actionLoading === r.id;

                return (
                  <tr key={r.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 26, height: 26, borderRadius: "50%",
                          background: "rgba(99,102,241,0.15)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#818cf8", flexShrink: 0
                        }}>
                          <Mail size={13} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                            {r.user_email || "unknown"}
                          </div>
                          {r.username && (
                            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                              Username: {r.username}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "var(--text-muted)" }}>
                      {r.id.substring(0, 8)}...
                    </td>

                    <td style={{ fontSize: "var(--fs-xs, 0.625rem)", color: "var(--text-muted)" }}>
                      {r.created_at ? new Date(r.created_at).toLocaleString("vi-VN") : "—"}
                    </td>

                    <td>
                      {isPending && (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          padding: "3px 8px", borderRadius: 6,
                          background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)",
                          color: "#fbbf24", fontSize: "0.68rem", fontWeight: 600
                        }}>
                          <Clock size={11} /> Chờ duyệt
                        </span>
                      )}
                      {isApproved && (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          padding: "3px 8px", borderRadius: 6,
                          background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)",
                          color: "#4ade80", fontSize: "0.68rem", fontWeight: 600
                        }}>
                          <CheckCircle2 size={11} /> Đã cấp mật khẩu
                        </span>
                      )}
                      {isRejected && (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          padding: "3px 8px", borderRadius: 6,
                          background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
                          color: "#f87171", fontSize: "0.68rem", fontWeight: 600
                        }}>
                          <XCircle size={11} /> Đã từ chối
                        </span>
                      )}
                    </td>

                    <td style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                      {r.admin_note || (isApproved ? "Đã gửi Gmail" : "—")}
                    </td>

                    <td style={{ textAlign: "right" }}>
                      {isPending ? (
                        <div style={{ display: "inline-flex", gap: 6 }}>
                          <button
                            onClick={() => handleApprove(r.id, r.user_email)}
                            disabled={isActionLoading}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 5,
                              padding: "6px 12px", borderRadius: 8,
                              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                              border: "none", color: "#fff", fontSize: "0.72rem", fontWeight: 600,
                              cursor: isActionLoading ? "not-allowed" : "pointer",
                              boxShadow: "0 2px 8px rgba(16,185,129,0.3)"
                            }}
                          >
                            <Send size={11} />
                            <span>{isActionLoading ? "Đang xử lý..." : "Duyệt & Gửi Gmail"}</span>
                          </button>

                          <button
                            onClick={() => setReject({ id: r.id, email: r.user_email })}
                            disabled={isActionLoading}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 5,
                              padding: "6px 10px", borderRadius: 8,
                              background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
                              color: "#f87171", fontSize: "0.72rem", fontWeight: 600,
                              cursor: isActionLoading ? "not-allowed" : "pointer",
                            }}
                          >
                            <XCircle size={11} />
                            <span>Từ chối</span>
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                          {r.processed_at ? new Date(r.processed_at).toLocaleDateString("vi-VN") : "Đã xử lý"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal từ chối ── */}
      {rejectModal && (
        <div
          className="admin-modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setReject(null)}
        >
          <div className="admin-modal" style={{ maxWidth: 420 }}>
            <div className="admin-modal__header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ShieldAlert size={18} color="#f87171" />
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                  Từ chối yêu cầu cấp lại mật khẩu
                </span>
              </div>
            </div>

            <div style={{ padding: "16px 20px" }}>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0 0 12px" }}>
                Bạn sắp từ chối yêu cầu của tài khoản: <strong style={{ color: "var(--text-primary)" }}>{rejectModal.email}</strong>
              </p>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>
                Lý do từ chối (tùy chọn):
              </label>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="VD: Không xác minh được chủ sở hữu tài khoản..."
                className="admin-input"
                rows={3}
                style={{ width: "100%", boxSizing: "border-box", padding: 10 }}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setReject(null)}
                  className="admin-btn-action"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleRejectConfirm}
                  style={{
                    padding: "8px 16px", borderRadius: 8,
                    background: "#ef4444", border: "none", color: "#fff",
                    fontWeight: 600, fontSize: "0.8rem", cursor: "pointer"
                  }}
                >
                  Xác nhận Từ chối
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

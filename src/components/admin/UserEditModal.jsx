/**
 * UserEditModal.jsx — Hộp thoại chỉnh sửa quyền & gói người dùng
 * Đồng bộ với admin.css và chuẩn UI thiết kế của dự án
 */
import { useState } from "react";
import {
  X, Shield, ShieldOff, Crown, Star, User,
  LogOut, Loader2, AlertTriangle, CheckCircle, Clock
} from "lucide-react";
import { adminService } from "../../services/adminService";

const PLAN_OPTIONS = [
  { value: "free",       label: "Free",       desc: "Giới hạn cơ bản 10 file/ngày", color: "#9ca3af", icon: User },
  { value: "pro",        label: "Pro",        desc: "Không giới hạn tốc độ & Batch", color: "#06b6d4", icon: Star },
  { value: "enterprise", label: "Enterprise", desc: "Đầy đủ AI Engine & RIP Print",   color: "#f59e0b", icon: Crown },
];

const DURATION_PRESETS = [
  { days: 30,  label: "30 Ngày" },
  { days: 90,  label: "3 Tháng" },
  { days: 180, label: "6 Tháng" },
  { days: 365, label: "1 Năm" },
];

export default function UserEditModal({ user, onClose, onRefresh }) {
  const [loading, setLoading]         = useState(null); // "status" | "plan" | "revoke"
  const [selectedPlan, setSelectedPlan] = useState(user?.plan || "free");
  const [durationDays, setDurationDays] = useState(30);
  const [feedback, setFeedback]       = useState(null); // { type: "success"|"error", msg }

  if (!user) return null;

  const handleAction = async (action) => {
    setLoading(action);
    setFeedback(null);
    try {
      if (action === "ban") {
        await adminService.updateUserStatus(user.username, false, "Admin đã khóa tài khoản");
        setFeedback({ type: "success", msg: `Đã khóa truy cập tài khoản ${user.username}` });
      } else if (action === "unban") {
        await adminService.updateUserStatus(user.username, true);
        setFeedback({ type: "success", msg: `Đã mở khóa tài khoản ${user.username}` });
      } else if (action === "plan") {
        await adminService.updateUserPlan(user.username, selectedPlan, durationDays);
        setFeedback({ type: "success", msg: `Đã cập nhật gói ${selectedPlan.toUpperCase()} (+${durationDays} ngày) thành công!` });
      } else if (action === "revoke") {
        const res = await adminService.revokeSessions(user.username);
        setFeedback({ type: "success", msg: res.message || "Đã thu hồi phiên đăng nhập thành công" });
      }
      setTimeout(() => {
        onRefresh?.();
        if (action !== "plan") onClose();
      }, 1000);
    } catch (err) {
      setFeedback({ type: "error", msg: err.message });
    } finally {
      setLoading(null);
    }
  };

  const isBanned = !user.is_active;

  return (
    <div
      className="admin-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="admin-modal">

        {/* ── Modal Header ── */}
        <div className="admin-modal__header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "linear-gradient(135deg, var(--accent, #6366f1) 0%, #8b5cf6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.35)",
            }}>
              <User size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: "var(--fw-label, 560)", fontSize: "0.95rem", color: "var(--text-primary)" }}>
                {user.username}
              </div>
              <div style={{ fontSize: "var(--fs-xs, 0.625rem)", color: "var(--text-muted)" }}>
                {user.email || "Chưa có email"} · Vai trò: {user.role === "admin" ? "Admin" : "User"}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="admin-btn-action"
            style={{ padding: 6, borderRadius: 8 }}
          >
            <X size={14} />
          </button>
        </div>

        {/* ── Modal Body ── */}
        <div className="admin-modal__body">

          {/* Feedback message */}
          {feedback && (
            <div style={{
              padding: "10px 14px",
              borderRadius: 8,
              background: feedback.type === "success" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
              border: `1px solid ${feedback.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
              color: feedback.type === "success" ? "#34d399" : "#f87171",
              fontSize: "var(--fs-xs, 0.625rem)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              {feedback.type === "success" ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
              <span>{feedback.msg}</span>
            </div>
          )}

          {/* ── Mục 1: Cấp quyền Gói Bản Quyền ── */}
          <div>
            <div style={{
              fontSize: "var(--fs-xs, 0.625rem)",
              fontWeight: "var(--fw-label, 560)",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              color: "var(--text-muted)",
              marginBottom: 10,
            }}>
              Chọn Gói Bản Quyền Mới
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {PLAN_OPTIONS.map((plan) => {
                const Icon = plan.icon;
                const isSelected = selectedPlan === plan.value;

                return (
                  <div
                    key={plan.value}
                    onClick={() => setSelectedPlan(plan.value)}
                    className={`admin-option-card ${isSelected ? "selected" : ""}`}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        background: `${plan.color}18`,
                        border: `1px solid ${plan.color}35`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: plan.color,
                      }}>
                        <Icon size={14} />
                      </div>
                      <div>
                        <div style={{ fontSize: "var(--fs-sm, 0.6875rem)", fontWeight: "var(--fw-label, 560)", color: "var(--text-primary)" }}>
                          {plan.label}
                        </div>
                        <div style={{ fontSize: "var(--fs-xs, 0.625rem)", color: "var(--text-muted)" }}>
                          {plan.desc}
                        </div>
                      </div>
                    </div>

                    <div className="admin-option-card__radio" />
                  </div>
                );
              })}
            </div>

            {/* Thời hạn bản quyền */}
            <div style={{ marginTop: 12 }}>
              <div style={{
                fontSize: "var(--fs-xs, 0.625rem)",
                color: "var(--text-secondary)",
                marginBottom: 6,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}>
                <Clock size={12} />
                <span>Thời hạn kích hoạt thêm:</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {DURATION_PRESETS.map((p) => (
                  <button
                    key={p.days}
                    type="button"
                    onClick={() => setDurationDays(p.days)}
                    style={{
                      flex: 1,
                      padding: "6px 0",
                      borderRadius: 6,
                      fontSize: "var(--fs-xs, 0.625rem)",
                      fontFamily: "inherit",
                      border: durationDays === p.days ? "1px solid var(--accent, #6366f1)" : "1px solid var(--border)",
                      background: durationDays === p.days ? "rgba(99,102,241,0.15)" : "var(--surface)",
                      color: durationDays === p.days ? "var(--text-primary)" : "var(--text-muted)",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleAction("plan")}
              disabled={loading === "plan"}
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center", marginTop: 12, padding: "8px 0" }}
            >
              {loading === "plan" ? (
                <>
                  <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                  <span>Đang lưu bản quyền...</span>
                </>
              ) : (
                <span>Lưu & Kích Hoạt Gói {selectedPlan.toUpperCase()}</span>
              )}
            </button>
          </div>

          <div style={{ height: 1, background: "var(--border)" }} />

          {/* ── Mục 2: Thao tác Bảo Mật & Kỷ Luật ── */}
          <div>
            <div style={{
              fontSize: "var(--fs-xs, 0.625rem)",
              fontWeight: "var(--fw-label, 560)",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              color: "var(--text-muted)",
              marginBottom: 10,
            }}>
              Kiểm Soát An Ninh Tài Khoản
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {/* Nút Khóa / Mở Khóa */}
              <button
                onClick={() => handleAction(isBanned ? "unban" : "ban")}
                disabled={loading === "ban" || loading === "unban"}
                className={`admin-btn-action ${isBanned ? "" : "admin-btn-action--danger"}`}
                style={{ padding: "8px 12px", justifyContent: "center" }}
              >
                {loading === "ban" || loading === "unban" ? (
                  <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                ) : isBanned ? (
                  <>
                    <Shield size={13} color="#34d399" />
                    <span style={{ color: "#34d399" }}>Mở khóa tài khoản</span>
                  </>
                ) : (
                  <>
                    <ShieldOff size={13} />
                    <span>Khóa tài khoản</span>
                  </>
                )}
              </button>

              {/* Cưỡng chế đăng xuất */}
              <button
                onClick={() => handleAction("revoke")}
                disabled={loading === "revoke"}
                className="admin-btn-action"
                style={{ padding: "8px 12px", justifyContent: "center" }}
                title="Hủy toàn bộ phiên đăng nhập của người dùng này"
              >
                {loading === "revoke" ? (
                  <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  <>
                    <LogOut size={13} color="#f59e0b" />
                    <span>Thu hồi phiên (Logout)</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

        {/* ── Modal Footer ── */}
        <div className="admin-modal__footer">
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: "6px 14px", fontSize: "var(--fs-xs, 0.625rem)" }}
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}

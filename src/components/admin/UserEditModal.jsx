/**
 * UserEditModal.jsx — Hộp thoại chỉnh sửa quyền & gói người dùng
 */
import { useState } from "react";
import { X, Shield, ShieldOff, Crown, Star, User, LogOut, Loader2, AlertTriangle } from "lucide-react";
import { adminService } from "../../services/adminService";

const PLAN_OPTIONS = [
  { value: "free", label: "Free", color: "#9ca3af", icon: User },
  { value: "pro", label: "Pro", color: "#06b6d4", icon: Star },
  { value: "enterprise", label: "Enterprise", color: "#f59e0b", icon: Crown },
];

export default function UserEditModal({ user, onClose, onRefresh }) {
  const [loading, setLoading] = useState(null); // "status" | "plan" | "revoke"
  const [selectedPlan, setSelectedPlan] = useState(user?.plan || "free");
  const [durationDays, setDurationDays] = useState(30);
  const [feedback, setFeedback] = useState(null); // { type: "success"|"error", msg }

  if (!user) return null;

  const handleAction = async (action) => {
    setLoading(action);
    setFeedback(null);
    try {
      if (action === "ban") {
        await adminService.updateUserStatus(user.username, false, "Admin action");
        setFeedback({ type: "success", msg: `Đã khóa tài khoản ${user.username}` });
      } else if (action === "unban") {
        await adminService.updateUserStatus(user.username, true);
        setFeedback({ type: "success", msg: `Đã mở khóa tài khoản ${user.username}` });
      } else if (action === "plan") {
        await adminService.updateUserPlan(user.username, selectedPlan, durationDays);
        setFeedback({ type: "success", msg: `Đã cập nhật gói ${selectedPlan} thành công` });
      } else if (action === "revoke") {
        const res = await adminService.revokeSessions(user.username);
        setFeedback({ type: "success", msg: res.message });
      }
      setTimeout(() => {
        onRefresh?.();
        onClose();
      }, 1200);
    } catch (err) {
      setFeedback({ type: "error", msg: err.message });
    } finally {
      setLoading(null);
    }
  };

  const isBanned = !user.is_active;
  const currentPlanInfo = PLAN_OPTIONS.find(p => p.value === (user.plan || "free")) || PLAN_OPTIONS[0];

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "linear-gradient(145deg, #1a1b2e 0%, #16172a 100%)",
          border: "1px solid rgba(99,102,241,0.25)",
          borderRadius: 20, padding: "28px 32px", width: 460, maxWidth: "95vw",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
          position: "relative",
        }}
      >
        {/* Close btn */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 16, right: 16,
            background: "rgba(255,255,255,0.06)", border: "none",
            borderRadius: 8, padding: 6, cursor: "pointer",
            color: "var(--text-secondary)", display: "flex",
          }}
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <User size={20} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "1rem", color: "#fff" }}>
                {user.username}
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                {user.email || "Chưa có email"} · {user.created_at ? new Date(user.created_at).toLocaleDateString("vi-VN") : "—"}
              </div>
            </div>
            {/* Status badge */}
            <div style={{
              marginLeft: "auto",
              padding: "4px 10px", borderRadius: 20,
              background: isBanned ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
              border: `1px solid ${isBanned ? "#ef444440" : "#10b98140"}`,
              fontSize: "0.65rem", fontWeight: 700,
              color: isBanned ? "#ef4444" : "#10b981",
            }}>
              {isBanned ? "🔴 Đã khóa" : "🟢 Hoạt động"}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <currentPlanInfo.icon size={13} color={currentPlanInfo.color} />
            <span style={{ fontSize: "0.7rem", color: currentPlanInfo.color, fontWeight: 600 }}>
              Gói hiện tại: {currentPlanInfo.label}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginBottom: 20 }} />

        {/* ── Phần 1: Khoá / Mở khoá ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
            Trạng thái tài khoản
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <ActionButton
              icon={ShieldOff} label="Khóa tài khoản" danger
              disabled={isBanned || loading === "ban"}
              loading={loading === "ban"}
              onClick={() => handleAction("ban")}
            />
            <ActionButton
              icon={Shield} label="Mở khóa" accent="#10b981"
              disabled={!isBanned || loading === "unban"}
              loading={loading === "unban"}
              onClick={() => handleAction("unban")}
            />
          </div>
        </div>

        {/* ── Phần 2: Cập nhật Gói ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
            Cập nhật gói bản quyền
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            {PLAN_OPTIONS.map(({ value, label, color, icon: PlanIcon }) => (
              <button
                key={value}
                onClick={() => setSelectedPlan(value)}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 10,
                  border: `1px solid ${selectedPlan === value ? color : "rgba(255,255,255,0.08)"}`,
                  background: selectedPlan === value ? `${color}18` : "transparent",
                  color: selectedPlan === value ? color : "var(--text-secondary)",
                  cursor: "pointer", fontSize: "0.72rem", fontWeight: 700,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  transition: "all 0.15s",
                }}
              >
                <PlanIcon size={15} />
                {label}
              </button>
            ))}
          </div>
          {selectedPlan !== "free" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>Thời hạn:</span>
              <input
                type="number" min={1} max={3650} value={durationDays}
                onChange={e => setDurationDays(Number(e.target.value))}
                style={{
                  width: 70, padding: "5px 8px", borderRadius: 7,
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                  color: "#fff", fontSize: "0.75rem", textAlign: "center",
                }}
              />
              <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>ngày</span>
            </div>
          )}
          <ActionButton
            icon={Crown} label={`Áp dụng gói ${selectedPlan}`}
            accent="#6366f1"
            loading={loading === "plan"}
            disabled={!!loading}
            onClick={() => handleAction("plan")}
            full
          />
        </div>

        {/* ── Phần 3: Thu hồi phiên ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
            Quản lý phiên từ xa
          </div>
          <ActionButton
            icon={LogOut} label="Thu hồi tất cả phiên (Force Logout)"
            accent="#f59e0b"
            loading={loading === "revoke"}
            disabled={!!loading}
            onClick={() => handleAction("revoke")}
            full
          />
        </div>

        {/* Feedback */}
        {feedback && (
          <div style={{
            padding: "10px 14px", borderRadius: 10, marginTop: 4,
            background: feedback.type === "success" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
            border: `1px solid ${feedback.type === "success" ? "#10b98140" : "#ef444440"}`,
            color: feedback.type === "success" ? "#10b981" : "#ef4444",
            fontSize: "0.72rem", fontWeight: 500,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            {feedback.type === "error" && <AlertTriangle size={13} />}
            {feedback.msg}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-component: nút hành động ──────────────────────────────────────────────
function ActionButton({ icon: Icon, label, danger, accent, loading, disabled, onClick, full }) {
  const color = danger ? "#ef4444" : (accent || "#6366f1");
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: full ? "1 1 100%" : 1,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        padding: "9px 14px", borderRadius: 10,
        background: disabled && !loading ? "rgba(255,255,255,0.03)" : `${color}15`,
        border: `1px solid ${disabled && !loading ? "rgba(255,255,255,0.08)" : `${color}40`}`,
        color: disabled && !loading ? "var(--text-secondary)" : color,
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: "0.72rem", fontWeight: 600,
        transition: "all 0.15s",
        opacity: disabled && !loading ? 0.5 : 1,
      }}
    >
      {loading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Icon size={13} />}
      {label}
    </button>
  );
}

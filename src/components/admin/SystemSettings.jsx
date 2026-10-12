/**
 * SystemSettings.jsx — Cấu hình hệ thống từ xa (Remote System Settings)
 * Đồng bộ với admin.css và chuẩn UI thiết kế của dự án
 */
import { useState, useEffect } from "react";
import {
  Settings, Save, Loader2, AlertTriangle,
  CheckCircle, Radio, Wrench, Megaphone, Smartphone
} from "lucide-react";
import { adminService } from "../../services/adminService";

export default function SystemSettings() {
  const [config, setConfig] = useState({
    min_version: "",
    banner_msg: "",
    maintenance_mode: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    adminService.getSystemConfig()
      .then(data => setConfig({
        min_version: data.min_version || "",
        banner_msg: data.banner_msg || "",
        maintenance_mode: data.maintenance_mode || false,
      }))
      .catch(err => setFeedback({ type: "error", msg: err.message }))
      .finally(() => setLoading(false));
  }, []);

  const handleToggleMaintenance = async (newVal) => {
    setConfig(c => ({ ...c, maintenance_mode: newVal }));
    setSaving(true);
    setFeedback(null);
    try {
      await adminService.broadcastSystem({
        minVersion: config.min_version || undefined,
        bannerMsg: config.banner_msg || undefined,
        maintenanceMode: newVal,
      });
      setFeedback({
        type: "success",
        msg: newVal
          ? "Đã BẬT Chế độ bảo trì hệ thống! Người dùng thông thường sẽ bị chặn đăng nhập."
          : "Đã TẮT Chế độ bảo trì! Hệ thống đã mở lại bình thường cho toàn bộ người dùng."
      });
    } catch (err) {
      // Revert state if failed
      setConfig(c => ({ ...c, maintenance_mode: !newVal }));
      setFeedback({ type: "error", msg: `Lỗi khi đổi trạng thái bảo trì: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      await adminService.broadcastSystem({
        minVersion: config.min_version || undefined,
        bannerMsg: config.banner_msg || undefined,
        maintenanceMode: config.maintenance_mode,
      });
      setFeedback({ type: "success", msg: "Đã lưu và phát cấu hình hệ thống thành công!" });
    } catch (err) {
      setFeedback({ type: "error", msg: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-card" style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
        <Loader2 size={18} style={{ animation: "spin 1s linear infinite", display: "inline-block", marginRight: 8 }} />
        <span>Đang nạp cấu hình hệ thống từ đám mây...</span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680 }}>
      <form onSubmit={handleSave} className="admin-card">

        {/* ── Header ── */}
        <div className="admin-card__header">
          <div>
            <div className="admin-card__title">
              <Settings size={16} color="var(--accent-2, #818cf8)" />
              <span>Cấu Hình Tham Số & Điều Khiển Từ Xa</span>
            </div>
            <div className="admin-card__sub">
              Áp dụng tức thì cho mọi máy trạm desktop RenGoFun đang chạy
            </div>
          </div>
        </div>

        <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Feedback alert */}
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

          {/* ── 1. Chế độ Bảo trì (Maintenance Mode) ── */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 18px",
            background: config.maintenance_mode ? "rgba(239, 68, 68, 0.08)" : "var(--surface)",
            border: `1px solid ${config.maintenance_mode ? "rgba(239, 68, 68, 0.3)" : "var(--border)"}`,
            borderRadius: 12,
            transition: "all 0.2s ease",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: config.maintenance_mode ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: config.maintenance_mode ? "#f87171" : "var(--text-muted)",
              }}>
                <Wrench size={18} />
              </div>
              <div>
                <div style={{
                  fontSize: "var(--fs-sm, 0.6875rem)",
                  fontWeight: "var(--fw-label, 560)",
                  color: config.maintenance_mode ? "#f87171" : "var(--text-primary)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}>
                  <span>Chế Độ Bảo Trì Hệ Thống</span>
                  {config.maintenance_mode && (
                    <span className="admin-badge admin-badge--offline" style={{ padding: "1px 6px" }}>
                      Đang bật
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "var(--fs-xs, 0.625rem)", color: "var(--text-muted)", marginTop: 3 }}>
                  Khi bật, người dùng thông thường sẽ không thể đăng nhập hoặc đồng bộ
                </div>
              </div>
            </div>

            {/* iOS Style Toggle Switch with Auto-Save */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {saving && <Loader2 size={14} style={{ animation: "spin 1s linear infinite", color: "var(--accent-2)" }} />}
              <label className="admin-switch" title="Gạt để Bật / Tắt chế độ bảo trì">
                <input
                  type="checkbox"
                  disabled={saving}
                  checked={config.maintenance_mode}
                  onChange={e => handleToggleMaintenance(e.target.checked)}
                />
                <span className="admin-switch__slider" />
              </label>
            </div>
          </div>

          {/* ── 2. Phiên bản tối thiểu (Min Version) ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{
              fontSize: "var(--fs-xs, 0.625rem)",
              fontWeight: "var(--fw-label, 560)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              <Smartphone size={13} />
              <span>Phiên Bản Ứng Dụng Tối Thiểu (Min Client Version)</span>
            </label>
            <input
              type="text"
              value={config.min_version}
              onChange={e => setConfig(c => ({ ...c, min_version: e.target.value }))}
              placeholder="Ví dụ: 2.0.1"
              className="admin-input"
            />
            <span style={{ fontSize: "var(--fs-xs, 0.625rem)", color: "var(--text-muted)" }}>
              Các máy trạm đang chạy phiên bản nhỏ hơn giá trị này sẽ tự động hiển thị popup yêu cầu cập nhật.
            </span>
          </div>

          {/* ── 3. Banner thông báo khẩn cấp ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{
              fontSize: "var(--fs-xs, 0.625rem)",
              fontWeight: "var(--fw-label, 560)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              <Megaphone size={13} />
              <span>Thông Báo Khẩn Cấp Hệ Thống (Broadcast Banner)</span>
            </label>
            <textarea
              value={config.banner_msg}
              onChange={e => setConfig(c => ({ ...c, banner_msg: e.target.value }))}
              placeholder="Nhập nội dung cảnh báo hiển thị trên đầu ứng dụng của toàn bộ người dùng..."
              rows={3}
              className="admin-input"
              style={{ resize: "vertical", lineHeight: 1.5 }}
            />
            <span style={{ fontSize: "var(--fs-xs, 0.625rem)", color: "var(--text-muted)" }}>
              Để trống nếu không có thông báo đặc biệt nào.
            </span>
          </div>

          {/* ── Submit Action ── */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
              style={{ padding: "8px 18px" }}
            >
              {saving ? (
                <>
                  <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save size={13} />
                  <span>Lưu Cấu Hình Hệ Thống</span>
                </>
              )}
            </button>
          </div>

        </div>

      </form>
    </div>
  );
}

/**
 * SystemSettings.jsx — Cấu hình hệ thống từ xa (Remote System Settings)
 */
import { useState, useEffect } from "react";
import { Settings, Save, Loader2, AlertTriangle, CheckCircle, Radio } from "lucide-react";
import { adminService } from "../../services/adminService";

export default function SystemSettings() {
  const [config, setConfig] = useState({ min_version: "", banner_msg: "", maintenance_mode: false });
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

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      await adminService.broadcastSystem({
        minVersion: config.min_version || undefined,
        bannerMsg: config.banner_msg || undefined,
        maintenanceMode: config.maintenance_mode,
      });
      setFeedback({ type: "success", msg: "Đã cập nhật cấu hình hệ thống thành công!" });
    } catch (err) {
      setFeedback({ type: "error", msg: err.message });
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "9px 12px",
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 9, color: "#fff", fontSize: "0.77rem", boxSizing: "border-box",
  };
  const labelStyle = { fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40, gap: 10, color: "var(--text-secondary)" }}>
        <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
        <span style={{ fontSize: "0.75rem" }}>Đang tải cấu hình...</span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{
        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 14, padding: "24px 28px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Settings size={16} color="#6366f1" />
          </div>
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>Cấu hình từ xa</div>
            <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)" }}>Áp dụng ngay cho tất cả client kết nối</div>
          </div>
        </div>

        {/* ── Phiên bản tối thiểu ── */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Phiên bản ứng dụng tối thiểu (Min App Version)</label>
          <input
            value={config.min_version}
            onChange={e => setConfig(c => ({ ...c, min_version: e.target.value }))}
            placeholder="vd: 1.0.2"
            style={inputStyle}
          />
          <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", marginTop: 5 }}>
            Client chạy phiên bản thấp hơn sẽ nhận thông báo yêu cầu cập nhật.
          </div>
        </div>

        {/* ── Banner thông báo ── */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Banner thông báo hệ thống</label>
          <textarea
            value={config.banner_msg}
            onChange={e => setConfig(c => ({ ...c, banner_msg: e.target.value }))}
            placeholder="Nhập thông báo hiển thị cho tất cả người dùng (để trống nếu không có)..."
            rows={3}
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
          />
        </div>

        {/* ── Chế độ bảo trì ── */}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Chế độ bảo trì (Maintenance Mode)</label>
          <div
            onClick={() => setConfig(c => ({ ...c, maintenance_mode: !c.maintenance_mode }))}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 16px", borderRadius: 10, cursor: "pointer",
              background: config.maintenance_mode ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${config.maintenance_mode ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.08)"}`,
              transition: "all 0.2s",
            }}
          >
            <Radio size={16} color={config.maintenance_mode ? "#f59e0b" : "#94a3b8"} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: config.maintenance_mode ? "#f59e0b" : "#e2e8f0" }}>
                {config.maintenance_mode ? "🛠️ Đang bảo trì" : "Bảo trì đã tắt"}
              </div>
              <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)" }}>
                {config.maintenance_mode ? "App Desktop sẽ hiện thông báo hoãn đồng bộ." : "Nhấn để bật chế độ bảo trì."}
              </div>
            </div>
            {/* Toggle */}
            <div style={{
              width: 44, height: 24, borderRadius: 12,
              background: config.maintenance_mode ? "#f59e0b" : "rgba(255,255,255,0.15)",
              position: "relative", transition: "background 0.2s",
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: "50%", background: "#fff",
                position: "absolute", top: 3,
                left: config.maintenance_mode ? 23 : 3,
                transition: "left 0.2s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              }} />
            </div>
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: "100%", padding: "11px 0", borderRadius: 10,
            background: saving ? "rgba(99,102,241,0.2)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
            border: "none", color: "#fff", cursor: saving ? "not-allowed" : "pointer",
            fontSize: "0.8rem", fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: saving ? "none" : "0 4px 16px rgba(99,102,241,0.35)",
            transition: "all 0.2s",
          }}
        >
          {saving ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={15} />}
          {saving ? "Đang lưu..." : "Lưu & Broadcast toàn hệ thống"}
        </button>

        {/* Feedback */}
        {feedback && (
          <div style={{
            marginTop: 12, padding: "10px 14px", borderRadius: 10,
            background: feedback.type === "success" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
            border: `1px solid ${feedback.type === "success" ? "#10b98140" : "#ef444440"}`,
            color: feedback.type === "success" ? "#10b981" : "#ef4444",
            fontSize: "0.72rem", fontWeight: 500,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            {feedback.type === "success" ? <CheckCircle size={13} /> : <AlertTriangle size={13} />}
            {feedback.msg}
          </div>
        )}
      </div>
    </div>
  );
}

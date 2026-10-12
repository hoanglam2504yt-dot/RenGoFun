/**
 * AdminDashboard.jsx — Trang quản trị hệ thống RenGoFun v2.0
 * Protected: Chỉ user.role === "admin" mới được truy cập.
 * Đồng bộ chuẩn CSS Tokens từ layout.css, dashboard.css & admin.css
 */
import { useState, useEffect } from "react";
import {
  BarChart2, Users, Shield, Settings,
  RefreshCw, WifiOff, ShieldCheck, KeyRound,
} from "lucide-react";
import "../styles/admin.css";
import { adminService } from "../services/adminService";
import MetricCards from "../components/admin/MetricCards";
import UserTable from "../components/admin/UserTable";
import SecurityLogViewer from "../components/admin/SecurityLogViewer";
import SystemSettings from "../components/admin/SystemSettings";
import PasswordResetManager from "../components/admin/PasswordResetManager";

// ── Tab definitions ───────────────────────────────────────────────────────────
const TABS = [
  { id: "overview",  Icon: BarChart2, label: "Tổng quan & Chỉ số" },
  { id: "users",     Icon: Users,     label: "Quản lý Người dùng" },
  { id: "resets",    Icon: KeyRound,  label: "Duyệt Đổi Mật Khẩu" },
  { id: "security",  Icon: Shield,    label: "Nhật ký An ninh" },
  { id: "system",    Icon: Settings,  label: "Cấu hình Từ xa" },
];

export default function AdminDashboard({ user }) {
  const [activeTab, setActiveTab]   = useState("overview");
  const [metrics, setMetrics]       = useState(null);
  const [loadingMetrics, setLoading] = useState(false);
  const [cloudStatus, setCloudStatus] = useState("checking"); // "live" | "offline" | "checking"

  // Fetch metrics & check cloud status
  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const data = await adminService.getMetrics();
      setMetrics(data);
      setCloudStatus("live");
    } catch {
      setCloudStatus("offline");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMetrics(); }, []);

  return (
    <div className="admin-page">

      {/* ── Admin Header ─────────────────────────────────────────────────── */}
      <div className="admin-header">
        <div className="admin-header__brand">
          <div className="admin-header__icon-box">
            <ShieldCheck size={20} color="#ffffff" />
          </div>
          <div>
            <h1 className="admin-header__title">
              Bảng Điều Khiển Quản Trị Hệ Thống
            </h1>
            <div className="admin-header__sub">
              RenGoFun Ecosystem · Quản lý tập trung Cloud Auth & Desktop Licensing
            </div>
          </div>
        </div>

        <div className="admin-header__meta">
          {/* Cloud status badge */}
          <div className={`admin-badge ${cloudStatus === "live" ? "admin-badge--live" : cloudStatus === "offline" ? "admin-badge--offline" : "admin-badge--checking"}`}>
            {cloudStatus === "offline" ? (
              <WifiOff size={11} />
            ) : (
              <span className="live-dot" style={{
                background: cloudStatus === "live" ? "#34d399" : "#fbbf24",
                boxShadow: `0 0 6px ${cloudStatus === "live" ? "rgba(52,211,153,0.7)" : "rgba(251,191,36,0.7)"}`,
              }} />
            )}
            {cloudStatus === "live" ? "Cloud: Sẵn sàng" : cloudStatus === "offline" ? "Cloud: Mất kết nối" : "Đang kiểm tra..."}
          </div>

          {/* Admin identifier badge */}
          <div className="admin-badge admin-badge--role">
            <Shield size={11} />
            <span>Admin: {user?.username}</span>
          </div>

          {/* Refresh button */}
          <button
            onClick={fetchMetrics}
            className="admin-btn-action"
            title="Làm mới chỉ số"
          >
            <RefreshCw size={13} style={loadingMetrics ? { animation: "spin 1s linear infinite" } : {}} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* ── Navigation Tabs ──────────────────────────────────────────────── */}
      <div className="admin-tabs">
        {TABS.map(({ id, Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`admin-tab-btn ${activeTab === id ? "active" : ""}`}
          >
            <Icon size={14} strokeWidth={activeTab === id ? 2.5 : 1.75} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab Contents ─────────────────────────────────────────────────── */}
      <div className="admin-content" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* TAB 1: Tổng quan */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <MetricCards metrics={metrics} loading={loadingMetrics} />

            {/* Plan distribution bar */}
            {metrics && (
              <PlanDistributionBar
                free={metrics.plan_distribution?.free || 0}
                pro={metrics.plan_distribution?.pro || 0}
                enterprise={metrics.plan_distribution?.enterprise || 0}
                total={metrics.total_users || 1}
              />
            )}
          </div>
        )}

        {/* TAB 2: Quản lý Người dùng */}
        {activeTab === "users" && (
          <div>
            <UserTable />
          </div>
        )}

        {/* TAB: Duyệt Đổi Mật Khẩu */}
        {activeTab === "resets" && (
          <div>
            <PasswordResetManager />
          </div>
        )}

        {/* TAB 3: Nhật ký An ninh */}
        {activeTab === "security" && (
          <div>
            <SecurityLogViewer />
          </div>
        )}

        {/* TAB 4: Cấu hình Từ xa */}
        {activeTab === "system" && (
          <div>
            <SystemSettings />
          </div>
        )}
      </div>

    </div>
  );
}

// ── Sub-component: Plan Distribution Bar ─────────────────────────────────────
function PlanDistributionBar({ free, pro, enterprise, total }) {
  const freeW = total > 0 ? (free / total) * 100 : 0;
  const proW  = total > 0 ? (pro  / total) * 100 : 0;
  const entW  = total > 0 ? (enterprise / total) * 100 : 0;

  return (
    <div className="admin-card">
      <div className="admin-card__header">
        <div>
          <div className="admin-card__title">
            Phân Bổ Bản Quyền Gói Dịch Vụ
          </div>
          <div className="admin-card__sub">
            Tỷ lệ tài khoản người dùng theo các cấp độ giấy phép
          </div>
        </div>
      </div>

      <div style={{ padding: "18px 20px" }}>
        {/* Progress Bar Container */}
        <div style={{
          display: "flex",
          height: 10,
          borderRadius: 6,
          overflow: "hidden",
          marginBottom: 16,
          background: "rgba(255,255,255,0.06)",
        }}>
          <div style={{ width: `${freeW}%`, background: "#9ca3af", transition: "width 0.4s ease" }} title={`Free: ${free}`} />
          <div style={{ width: `${proW}%`,  background: "#06b6d4", transition: "width 0.4s ease" }} title={`Pro: ${pro}`} />
          <div style={{ width: `${entW}%`,  background: "#f59e0b", transition: "width 0.4s ease" }} title={`Enterprise: ${enterprise}`} />
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {[
            { label: "Gói Free",       count: free,       pct: freeW.toFixed(1), color: "#9ca3af" },
            { label: "Gói Pro",        count: pro,        pct: proW.toFixed(1),  color: "#06b6d4" },
            { label: "Gói Enterprise", count: enterprise, pct: entW.toFixed(1),  color: "#f59e0b" },
          ].map(({ label, count, pct, color }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: color, display: "inline-block" }} />
              <span style={{ fontSize: "var(--fs-sm, 0.6875rem)", color: "var(--text-secondary)" }}>
                {label}: <strong style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{count} ({pct}%)</strong>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * AdminDashboard.jsx — Trang quản trị hệ thống RenGoFun v2.0
 * Protected: Chỉ user.role === "admin" mới được truy cập.
 */
import { useState, useEffect } from "react";
import {
  BarChart2, Users, Shield, Settings,
  RefreshCw, WifiOff, ShieldCheck,
} from "lucide-react";
import { adminService } from "../services/adminService";
import MetricCards from "../components/admin/MetricCards";
import UserTable from "../components/admin/UserTable";
import SecurityLogViewer from "../components/admin/SecurityLogViewer";
import SystemSettings from "../components/admin/SystemSettings";

// ── Tab definitions ───────────────────────────────────────────────────────────
const TABS = [
  { id: "overview",  Icon: BarChart2, label: "Tổng quan" },
  { id: "users",     Icon: Users,     label: "Người dùng" },
  { id: "security",  Icon: Shield,    label: "Nhật ký an ninh" },
  { id: "system",    Icon: Settings,  label: "Cài đặt từ xa" },
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
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 0 }}>

      {/* ── Admin Header Bar ─────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 20px",
        background: "linear-gradient(90deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.05) 100%)",
        borderBottom: "1px solid rgba(99,102,241,0.15)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(99,102,241,0.4)",
          }}>
            <ShieldCheck size={18} color="white" />
          </div>
          <div>
            <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>
              Bảng điều khiển hệ thống
            </div>
            <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)" }}>
              RenGoFun Admin Dashboard v2.0
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Cloud status badge */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "5px 12px", borderRadius: 20,
            background: cloudStatus === "live" ? "rgba(16,185,129,0.12)" : cloudStatus === "offline" ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)",
            border: `1px solid ${cloudStatus === "live" ? "#10b98140" : cloudStatus === "offline" ? "#ef444440" : "#f59e0b40"}`,
            fontSize: "0.65rem", fontWeight: 700,
            color: cloudStatus === "live" ? "#10b981" : cloudStatus === "offline" ? "#ef4444" : "#f59e0b",
          }}>
            {cloudStatus === "offline" ? <WifiOff size={11} /> : (
              <span style={{
                width: 7, height: 7, borderRadius: "50%",
                background: cloudStatus === "live" ? "#10b981" : "#f59e0b",
                boxShadow: `0 0 6px ${cloudStatus === "live" ? "#10b981" : "#f59e0b"}`,
                animation: cloudStatus === "checking" ? "pulse 1s infinite" : "none",
              }} />
            )}
            {cloudStatus === "live" ? "Cloud: Live" : cloudStatus === "offline" ? "Cloud: Offline" : "Đang kết nối..."}
          </div>

          {/* Admin badge */}
          <div style={{
            padding: "5px 12px", borderRadius: 20,
            background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)",
            fontSize: "0.65rem", fontWeight: 700, color: "#818cf8",
          }}>
            ⚙️ Admin: {user?.username}
          </div>

          {/* Refresh */}
          <button
            onClick={fetchMetrics}
            style={{
              padding: "6px 10px", borderRadius: 8,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              color: "var(--text-secondary)", cursor: "pointer", display: "flex",
            }}
          >
            <RefreshCw size={13} style={loadingMetrics ? { animation: "spin 1s linear infinite" } : {}} />
          </button>
        </div>
      </div>

      {/* ── Tab Navigation ─────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", gap: 2, padding: "10px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(0,0,0,0.15)",
        flexShrink: 0,
      }}>
        {TABS.map(({ id, Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "7px 14px", borderRadius: 8,
              border: "none", cursor: "pointer", fontSize: "0.73rem", fontWeight: 600,
              background: activeTab === id ? "rgba(99,102,241,0.2)" : "transparent",
              color: activeTab === id ? "#818cf8" : "var(--text-secondary)",
              borderBottom: activeTab === id ? "2px solid #6366f1" : "2px solid transparent",
              transition: "all 0.15s",
            }}
          >
            <Icon size={14} strokeWidth={activeTab === id ? 2.5 : 1.75} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Content Area ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px" }}>

        {/* TAB: Tổng quan */}
        {activeTab === "overview" && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                📊 Tổng quan vận hành
              </h2>
              <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                Dữ liệu thời gian thực từ MongoDB Atlas · Tự động cập nhật khi làm mới
              </p>
            </div>
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

        {/* TAB: Người dùng */}
        {activeTab === "users" && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                👥 Quản lý người dùng
              </h2>
              <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                Tìm kiếm, lọc, khóa tài khoản và quản lý gói bản quyền
              </p>
            </div>
            <UserTable />
          </div>
        )}

        {/* TAB: Nhật ký an ninh */}
        {activeTab === "security" && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                🛡️ Nhật ký an ninh & Kiểm toán
              </h2>
              <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                Theo dõi đăng nhập, hành động admin và cảnh báo brute-force
              </p>
            </div>
            <SecurityLogViewer />
          </div>
        )}

        {/* TAB: Cài đặt từ xa */}
        {activeTab === "system" && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                ⚙️ Cấu hình hệ thống từ xa
              </h2>
              <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                Cài đặt phiên bản tối thiểu, banner thông báo và chế độ bảo trì
              </p>
            </div>
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
    <div style={{
      background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 14, padding: "20px 22px", marginTop: 4,
    }}>
      <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 14 }}>
        Phân bổ gói bản quyền
      </div>
      {/* Bar */}
      <div style={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", marginBottom: 12, background: "rgba(255,255,255,0.05)" }}>
        <div style={{ width: `${freeW}%`, background: "#9ca3af", transition: "width 0.4s" }} />
        <div style={{ width: `${proW}%`,  background: "#06b6d4", transition: "width 0.4s" }} />
        <div style={{ width: `${entW}%`,  background: "#f59e0b", transition: "width 0.4s" }} />
      </div>
      {/* Legend */}
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        {[
          { label: "Free",       count: free,       color: "#9ca3af" },
          { label: "Pro",        count: pro,        color: "#06b6d4" },
          { label: "Enterprise", count: enterprise, color: "#f59e0b" },
        ].map(({ label, count, color }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: color, display: "inline-block" }} />
            <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
              {label}: <strong style={{ color: "#e2e8f0" }}>{count}</strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

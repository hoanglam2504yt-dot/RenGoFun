/**
 * MetricCards.jsx — Thẻ chỉ số KPI tổng quan Admin Dashboard
 */
import { Users, ShieldAlert, TrendingUp, Lock } from "lucide-react";

function MetricCard({ icon: Icon, label, value, sub, color, glowColor }) {
  return (
    <div
      className="admin-metric-card"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
        border: `1px solid ${color}30`,
        borderRadius: 14,
        padding: "18px 22px",
        flex: 1,
        minWidth: 180,
        position: "relative",
        overflow: "hidden",
        boxShadow: `0 4px 24px ${glowColor || color}18`,
        transition: "transform 0.2s, box-shadow 0.2s",
        cursor: "default",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = `0 8px 32px ${glowColor || color}30`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = `0 4px 24px ${glowColor || color}18`;
      }}
    >
      {/* Glow blob */}
      <div style={{
        position: "absolute", top: -20, right: -20,
        width: 80, height: 80, borderRadius: "50%",
        background: `${color}18`, filter: "blur(20px)",
        pointerEvents: "none",
      }} />

      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `${color}18`, border: `1px solid ${color}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Icon size={18} color={color} strokeWidth={1.75} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
            {label}
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#fff", lineHeight: 1, letterSpacing: "-0.02em" }}>
            {value ?? <span style={{ color: "var(--text-secondary)" }}>—</span>}
          </div>
          {sub && (
            <div style={{ fontSize: "0.65rem", color: color, marginTop: 4, fontWeight: 500 }}>
              {sub}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MetricCards({ metrics, loading }) {
  const planDist = metrics?.plan_distribution || {};
  const proCount = (planDist.pro || 0) + (planDist.enterprise || 0);
  const proPercent = metrics?.total_users
    ? ((proCount / metrics.total_users) * 100).toFixed(1)
    : 0;

  const cards = [
    {
      icon: Users,
      label: "Tổng người dùng",
      value: loading ? "..." : metrics?.total_users ?? 0,
      sub: `${metrics?.active_users ?? 0} đang hoạt động`,
      color: "#6366f1",
    },
    {
      icon: TrendingUp,
      label: "Hoạt động",
      value: loading ? "..." : metrics?.active_users ?? 0,
      sub: `${metrics?.banned_users ?? 0} tài khoản bị khóa`,
      color: "#10b981",
    },
    {
      icon: Lock,
      label: "Tỷ lệ Pro / Enterprise",
      value: loading ? "..." : `${proCount}`,
      sub: `${proPercent}% tổng số tài khoản`,
      color: "#f59e0b",
    },
    {
      icon: ShieldAlert,
      label: "Cảnh báo an ninh",
      value: loading ? "..." : metrics?.security_alerts_today ?? 0,
      sub: metrics?.brute_force_ips > 0 ? `⚠️ ${metrics.brute_force_ips} IP brute-force` : "✓ Không có vi phạm",
      color: metrics?.brute_force_ips > 0 ? "#ef4444" : "#10b981",
      glowColor: metrics?.brute_force_ips > 0 ? "#ef4444" : "#10b981",
    },
  ];

  return (
    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
      {cards.map((card) => (
        <MetricCard key={card.label} {...card} />
      ))}
    </div>
  );
}

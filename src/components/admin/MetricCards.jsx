/**
 * MetricCards.jsx — Thẻ chỉ số KPI tổng quan Admin Dashboard
 * Đồng bộ với chuẩn stat-card trong dashboard.css & admin.css
 */
import { Users, UserCheck, ShieldAlert, Zap } from "lucide-react";

function MetricCard({ icon: Icon, label, value, sub, accentGradient, iconColor, iconBg }) {
  return (
    <div className="admin-metric-card">
      {/* Top accent border line */}
      <div
        className="admin-metric-card__accent"
        style={{ background: accentGradient }}
      />

      <div className="admin-metric-card__head">
        <span className="admin-metric-card__label">{label}</span>
        <div
          className="admin-metric-card__icon"
          style={{ background: iconBg, color: iconColor }}
        >
          <Icon size={16} strokeWidth={2} />
        </div>
      </div>

      <div className="admin-metric-card__value">
        {value}
      </div>

      <div className="admin-metric-card__sub">
        {sub}
      </div>
    </div>
  );
}

export default function MetricCards({ metrics, loading }) {
  const planDist = metrics?.plan_distribution || {};
  const proCount = (planDist.pro || 0) + (planDist.enterprise || 0);
  const total = metrics?.total_users || 0;
  const proPercent = total > 0 ? ((proCount / total) * 100).toFixed(1) : 0;

  const cards = [
    {
      icon: Users,
      label: "Tổng người dùng",
      value: loading ? "..." : (metrics?.total_users ?? 0),
      sub: `${metrics?.active_users ?? 0} tài khoản đang hoạt động`,
      accentGradient: "linear-gradient(90deg, #6366f1, #8b5cf6)",
      iconColor: "#818cf8",
      iconBg: "rgba(99, 102, 241, 0.12)",
    },
    {
      icon: UserCheck,
      label: "Hoạt động bình thường",
      value: loading ? "..." : (metrics?.active_users ?? 0),
      sub: `Tỷ lệ sẵn sàng: ${total > 0 ? Math.round(((metrics?.active_users ?? 0) / total) * 100) : 100}%`,
      accentGradient: "linear-gradient(90deg, #10b981, #06b6d4)",
      iconColor: "#34d399",
      iconBg: "rgba(16, 185, 129, 0.12)",
    },
    {
      icon: ShieldAlert,
      label: "Tài khoản bị khóa",
      value: loading ? "..." : (metrics?.banned_users ?? 0),
      sub: (metrics?.banned_users ?? 0) === 0 ? "Không có tài khoản bị phạt" : "Đã bị hạn chế đăng nhập",
      accentGradient: "linear-gradient(90deg, #ef4444, #f97316)",
      iconColor: "#f87171",
      iconBg: "rgba(239, 68, 68, 0.12)",
    },
    {
      icon: Zap,
      label: "Bản quyền trả phí",
      value: loading ? "..." : `${proPercent}%`,
      sub: `${proCount} tài khoản (Pro / Enterprise)`,
      accentGradient: "linear-gradient(90deg, #f59e0b, #ec4899)",
      iconColor: "#fbbf24",
      iconBg: "rgba(245, 158, 11, 0.12)",
    },
  ];

  return (
    <div className="admin-metrics-grid">
      {cards.map((card, i) => (
        <MetricCard key={i} {...card} />
      ))}
    </div>
  );
}

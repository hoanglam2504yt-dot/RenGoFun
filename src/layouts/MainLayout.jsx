import "../styles/layout.css";
import {
  Palette,
  LayoutDashboard,
  PenLine,
  Layers,
  Box,
  Wand2,
  Scissors,
  Contrast,
  Package,
  Cpu,
  Settings,
  CheckCircle,
  LogOut,
  User,
  ShieldCheck,
} from "lucide-react";

// ── Nav data ─────────────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: "Tổng quan & Editor",
    items: [
      { id: "dashboard", Icon: LayoutDashboard, label: "Trang chủ / Tổng quan" },
      { id: "editor", Icon: PenLine, label: "Trang chủ / Editor" },
    ],
  },
  {
    label: "In ấn",
    items: [
      { id: "queue", Icon: Layers, label: "Xử lý hàng loạt (Queue)", count: "3" },
      { id: "mockup", Icon: Box, label: "Tạo Mockup 3D" },
      { id: "smooth", Icon: Wand2, label: "Làm mượt & Kiểm viền DTF" },
      { id: "matting", Icon: Scissors, label: "Tách nền in & AI Matting" },
      { id: "spot", Icon: Palette, label: "Tách phim in lụa & Spot" },
      { id: "alpha", Icon: Contrast, label: "Trắng đen & Kiểm Alpha" },
    ],
  },
  {
    label: "Cài hình & Hệ thống",
    items: [
      { id: "presets", Icon: Package, label: "Khó Presets & Lưu trữ" },
      { id: "engine", Icon: Cpu, label: "Cài Engine & GPU" },
      { id: "settings", Icon: Settings, label: "Cài đặt chung & Tùy chỉnh" },
    ],
  },
];

// ── Header chip data ──────────────────────────────────────────────────────────
const HEADER_CHIPS = [
  { label: "Python 3.13", cls: "chip--green", dot: true },
  { label: "Sidecar", cls: "chip--blue", dot: true },
  { label: "CUDA 12.1 Ready", cls: "chip--amber", dot: false },
  { label: "Go 0.9ms", cls: "chip--blue", dot: false },
  { label: "RTX 4070 (Active)", cls: "chip--gpu", dot: true },
];

// ── Status footer items ───────────────────────────────────────────────────────
const FOOTER_STATUS = [
  { cls: "status-dot--green", label: "Tauri IPC Connected", Icon: CheckCircle }
];

// ═════════════════════════════════════════════════════════════════════════════
function MainLayout({ currentView, onNavigate, user, onLogout, children }) {
  return (
    <div className="shell">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar__logo">
          <div className="sidebar__logo-icon">
            <Palette size={16} color="#fff" />
          </div>
          <div>
            <div className="sidebar__logo-name">RenGoFun</div>
            <div className="sidebar__logo-ver">v2.4 Engine</div>
          </div>
        </div>

        {/* Nav sections */}
        {NAV_SECTIONS.map((section) => (
          <div className="sidebar__section" key={section.label}>
            <div className="sidebar__section-label">{section.label}</div>
            {section.items.map(({ id, Icon, label, count }) => (
              <button
                key={id}
                id={`nav-${id}`}
                className={`sidebar__item ${currentView === id ? "active" : ""}`}
                onClick={() => onNavigate(id)}
              >
                <span className="sidebar__item-icon">
                  <Icon size={15} strokeWidth={1.75} />
                </span>
                {label}
                {count && (
                  <span className="sidebar__item-count">{count}</span>
                )}
              </button>
            ))}
          </div>
        ))}

        {/* Admin nav button — chỉ hiện khi user.role === "admin" */}
        {user?.role === "admin" && (
          <div className="sidebar__section">
            <div className="sidebar__section-label">Quản trị</div>
            <button
              id="nav-admin"
              className={`sidebar__item ${currentView === "admin" ? "active" : ""}`}
              onClick={() => onNavigate("admin")}
              style={{
                borderLeft: currentView === "admin" ? "2px solid #6366f1" : "2px solid transparent",
                background: currentView === "admin" ? "rgba(99,102,241,0.12)" : undefined,
              }}
            >
              <span className="sidebar__item-icon">
                <ShieldCheck size={15} strokeWidth={1.75} color="#6366f1" />
              </span>
              <span style={{ color: "#818cf8", fontWeight: 700 }}>Quản trị hệ thống</span>
            </button>
          </div>
        )}

        <div className="sidebar__divider" />

        {/* Footer status */}
        <div className="sidebar__footer">
          {FOOTER_STATUS.map(({ cls, label }) => (
            <div className="status-row" key={label}>
              <span className={`status-dot ${cls}`} />
              {label}
            </div>
          ))}
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="main-area">
        {/* Top header */}
        <header className="top-header">
          <div className="top-header__breadcrumb">
            RenGoFun ›{" "}
            <span>
              {currentView === "dashboard" ? "Tổng quan" :
                currentView === "editor" ? "Editor chính" :
                  currentView === "queue" ? "Xử lý hàng loạt (Batch Processing)" :
                    currentView === "settings" ? "Cài đặt & Tùy chỉnh" :
                      currentView === "admin" ? "⚙️ Quản trị hệ thống" :
                        currentView}
            </span>
          </div>
          <div className="header-chips">
            {HEADER_CHIPS.map((c) => (
              <div key={c.label} className={`header-chip ${c.cls}`}>
                {c.dot && <span className="header-chip__dot" />}
                {c.label}
              </div>
            ))}
            {/* ── User info + quick logout ── */}
            {user && (
              <div style={{
                display: "flex", alignItems: "center", gap: 6, marginLeft: 8,
                borderLeft: "1px solid rgba(255,255,255,0.1)", paddingLeft: 10,
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <User size={11} color="white" />
                </div>
                <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                  {user.username}
                </span>
                <button
                  title="Đăng xuất"
                  onClick={onLogout}
                  style={{
                    display: "flex", alignItems: "center", padding: "3px 7px",
                    borderRadius: 5, cursor: "pointer",
                    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                    color: "#ef4444", gap: 3, fontSize: "0.62rem", fontWeight: 600,
                  }}
                >
                  <LogOut size={10} /> Ra
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default MainLayout;

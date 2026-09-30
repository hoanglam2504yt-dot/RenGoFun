import "../styles/layout.css";

// ── Nav data ─────────────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: "Tổng quan & Editor",
    items: [
      { id: "dashboard", icon: "⬡", label: "Trang chủ / Tổng quan" },
      { id: "editor",    icon: "✏️", label: "Trang chủ / Editor chính" },
    ],
  },
  {
    label: "In ấn & In ấn",
    items: [
      { id: "queue",   icon: "🗂", label: "Xử lý hàng loạt (Queue)", count: "3" },
      { id: "mockup",  icon: "🎲", label: "Tạo Mockup 3D" },
      { id: "smooth",  icon: "🔗", label: "Làm mượt & Kiểm viền DTF" },
      { id: "matting", icon: "✂️", label: "Tách nền in & AI Matting" },
      { id: "spot",    icon: "🎨", label: "Tách phim in lụa & Spot" },
      { id: "alpha",   icon: "◑",  label: "Trắng đen & Kiểm Alpha" },
    ],
  },
  {
    label: "Cài hình & Hệ thống",
    items: [
      { id: "presets", icon: "📦", label: "Khó Presets & Lưu trữ" },
      { id: "engine",  icon: "⚙️", label: "Cài Engine & GPU" },
      { id: "settings",icon: "🔧", label: "Cài đặt chung & Tùy chỉnh" },
    ],
  },
];

// ── Header chip data ──────────────────────────────────────────────────────────
const HEADER_CHIPS = [
  { label: "Python 3.13",  cls: "chip--green", dot: true },
  { label: "Sidecar",      cls: "chip--blue",  dot: true },
  { label: "CUDA 12.1 Ready", cls: "chip--amber", dot: false },
  { label: "Go 0.9ms",     cls: "chip--blue",  dot: false },
  { label: "RTX 4070 (Active)", cls: "chip--gpu", dot: true },
];

// ═════════════════════════════════════════════════════════════════════════════
function MainLayout({ currentView, onNavigate, children }) {
  return (
    <div className="shell">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar__logo">
          <div className="sidebar__logo-icon">🎨</div>
          <div>
            <div className="sidebar__logo-name">RenGoFun</div>
            <div className="sidebar__logo-ver">v2.4 Engine</div>
          </div>
        </div>

        {/* Nav sections */}
        {NAV_SECTIONS.map((section) => (
          <div className="sidebar__section" key={section.label}>
            <div className="sidebar__section-label">{section.label}</div>
            {section.items.map((item) => (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                className={`sidebar__item ${currentView === item.id ? "active" : ""}`}
                onClick={() => onNavigate(item.id)}
              >
                <span className="sidebar__item-icon">{item.icon}</span>
                {item.label}
                {item.count && (
                  <span className="sidebar__item-count">{item.count}</span>
                )}
              </button>
            ))}
          </div>
        ))}

        <div className="sidebar__divider" />

        {/* Footer status */}
        <div className="sidebar__footer">
          <div className="status-row">
            <span className="status-dot status-dot--green" />
            Tauri IPC Connected
          </div>
          <div className="status-row">
            <span className="status-dot status-dot--green" />
            Backend :8000 Online
          </div>
          <div className="status-row">
            <span className="status-dot status-dot--amber" />
            VRAM: 1.42 / 12.8 GB
          </div>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="main-area">
        {/* Top header */}
        <header className="top-header">
          <div className="top-header__breadcrumb">
            RenGoFun › <span>
              {currentView === "dashboard" ? "Tổng quan" :
               currentView === "editor"    ? "Editor chính" :
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

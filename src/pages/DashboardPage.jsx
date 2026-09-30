import "../styles/dashboard.css";
import {
  PenLine,
  Zap,
  Box,
  Wand2,
  Scissors,
  ScanSearch,
  Layers,
  Contrast,
  Upload,
  FolderOpen,
  Image,
  Lightbulb,
  Cpu,
  Printer,
  HardDrive,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
} from "lucide-react";

// ══════════════════════════════════════════════════════════════════════════════
//  MOCK DATA
// ══════════════════════════════════════════════════════════════════════════════

const STAT_CARDS = [
  {
    id: "files",
    label: "Tổng file xử lý",
    value: "3,842",
    sub: "Tổng số file đã qua engine",
    badge: { text: "+12% so với hôm qua", cls: "stat-card__badge--green" },
    percent: 74,
    accentColor: "linear-gradient(90deg,#6366f1,#a855f7)",
  },
  {
    id: "time",
    label: "Tiết kiệm thời gian",
    value: "1.4h / ảnh",
    sub: "So với xử lý thủ công Photoshop",
    badge: { text: "Tốc độ tăng", cls: "stat-card__badge--blue" },
    accentColor: "linear-gradient(90deg,#0ea5e9,#6366f1)",
  },
  {
    id: "gpu",
    label: "Tài nguyên nhớ Local",
    value: "RTX 4070",
    sub: "Hiệu suất khay in DTF & Phim",
    accentColor: "linear-gradient(90deg,#10b981,#06b6d4)",
    gpuStats: [
      { lbl: "VRAM",  val: "3.2 / 12S" },
      { lbl: "TMP",   val: "56 · 38%"  },
      { lbl: "WATT",  val: "50 / 58"   },
      { lbl: "UTIL",  val: "54%"       },
    ],
  },
];

const LAUNCHPAD_CARDS = [
  {
    id: "editor",
    name: "Editor Nhanh",
    Icon: PenLine,
    desc: "Chỉnh màu, khử nhiễu, làm mượt viền theo thao tác với GPU & Lua coding nghiệp.",
    meta: "Mr Canvas → 4 ms",
    tag: null,
    featured: true,
    navigateTo: "editor",
  },
  {
    id: "queue",
    name: "Xử lý hàng loạt (Queue)",
    Icon: Zap,
    desc: "Xử lý từng lượng server jobs, tự động sắp xếp theo thứ tự server.",
    meta: "Van Hang Bội → 2 lượng server",
    tag: { text: "QUEUE", cls: "tag--queue" },
    navigateTo: "queue",
  },
  {
    id: "mockup",
    name: "Tạo Mockup 3D",
    Icon: Box,
    desc: "Ghép ảnh vào mẫu áo, hoodie, tử code. Hỗ trợ nền trong suốt & góc nhìn tự do.",
    meta: "Phi quan → 4 ms - tmac!",
    tag: { text: "AI", cls: "tag--ai" },
    navigateTo: "mockup",
  },
  {
    id: "smooth",
    name: "Làm Mượt & Khử Viền DTF",
    Icon: Wand2,
    desc: "Nhận file in ngắn, sắp xếp theo queue. Hỗ trợ 50 quy chuẩn in, lọc theo ngưỡng nghiệp.",
    meta: "Cầu Kiếm Chông → Chính: 1 Zen",
    tag: { text: "DTF", cls: "tag--dtf" },
    navigateTo: "smooth",
  },
  {
    id: "matting",
    name: "Tách Nền AI & Matting",
    Icon: Scissors,
    desc: "Nhận cắt ảnh: BIREFNET 1.6 & REMBG 1.4. Lấy hồi pixel giữ ảnh mid micro.",
    meta: "Bộc Nền:REMBG → 5 Engine",
    tag: { text: "BIREFNET AI", cls: "tag--ai" },
    navigateTo: "matting",
  },
  {
    id: "upscale",
    name: "Đổi Kích Và AI Upscale",
    Icon: ScanSearch,
    desc: "Resize chuẩn nghề in NAM, tạo độ pixel đẹp đẹp với chế độ chuyên in.",
    meta: "→ AI Engine",
    tag: { text: "AI UPSCALE", cls: "tag--ai" },
    navigateTo: "upscale",
  },
  {
    id: "spot",
    name: "Tách Phim In Lụa & Spot",
    Icon: Layers,
    desc: "Nhận ảnh mẫu Pantone, xuất từng lớp phim tách theo màu lụa in, làm kênh.",
    meta: "Tách Màu Film → 4 ms",
    tag: { text: "SPOT", cls: "tag--spot" },
    navigateTo: "spot",
  },
  {
    id: "alpha",
    name: "Trắng Đen & Kênh Alpha",
    Icon: Contrast,
    desc: "Chuyển về trắng đen chuẩn 107.703, bảo toàn độ sắng khỏi màu DTF, lập.",
    meta: "Đọc Nhận Alpha → 1 Zen",
    tag: { text: "ALPHA", cls: "tag--dtf" },
    navigateTo: "alpha",
  },
];

const PIPELINE_ROWS = [
  { name: "Cyber_Tiger_Art.png",       size: "12.4 MB", dim: "4248×5",    status: "done",    ops: "Sắc Nét + (3KB FPT)" },
  { name: "Vintage_Rider_Back.ps...",  size: "8.2 MB",  dim: "3200×4...", status: "done",    ops: "Phim in → Đổi sáng" },
  { name: "Anime_Sakura_Front.pn...",  size: "7.1 MB",  dim: "3200×",     status: "pending", ops: "Kiểm tra → Pre-print" },
  { name: "Streetwear_Oversize_B...",  size: "3.2 MB",  dim: "4176×",     status: "error",   ops: "—" },
];

const DEVICE_ROWS_PRINTER = [
  { label: "Epson L18050 DTF Roll 20cm", val: "USB 3.0",  badgeCls: "badge--usb",    Icon: Printer  },
  { label: "AcrRIP / CADlink Engine v10", val: "Port 4148", badgeCls: null,           Icon: Activity },
  { label: "Hot Folder Watchdog",         val: "Active",   badgeCls: "badge--active", Icon: HardDrive},
];

// ══════════════════════════════════════════════════════════════════════════════
//  STATUS MAP
// ══════════════════════════════════════════════════════════════════════════════
const STATUS_MAP = {
  done:    { cls: "pill--done",    text: "Xong",       Icon: CheckCircle2 },
  pending: { cls: "pill--pending", text: "Đổi Sang",   Icon: Clock        },
  error:   { cls: "pill--error",   text: "Chờ in",     Icon: XCircle      },
  process: { cls: "pill--process", text: "Đang xử lý", Icon: Activity     },
};

// ══════════════════════════════════════════════════════════════════════════════
//  SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

function StatCards() {
  return (
    <div className="stat-cards">
      {STAT_CARDS.map((card) => (
        <div className="stat-card" key={card.id}>
          <div className="stat-card__accent" style={{ background: card.accentColor }} />
          <div className="stat-card__label">{card.label}</div>
          <div className="stat-card__value">{card.value}</div>
          <div className="stat-card__sub">{card.sub}</div>

          {card.gpuStats ? (
            <div className="stat-card__gpu-grid">
              {card.gpuStats.map((g) => (
                <div className="gpu-stat" key={g.lbl + g.val}>
                  <span className="gpu-stat__lbl">{g.lbl}</span>
                  <span className="gpu-stat__val">{g.val}</span>
                </div>
              ))}
            </div>
          ) : card.badge ? (
            <span className={`stat-card__badge ${card.badge.cls}`}>
              ↑ {card.badge.text}
            </span>
          ) : null}

          {card.percent !== undefined && (
            <div style={{ marginTop: 6 }}>
              <div style={{ height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 4 }}>
                <div style={{
                  height: "100%",
                  width: `${card.percent}%`,
                  background: card.accentColor,
                  borderRadius: 4,
                  transition: "width 0.6s ease",
                }} />
              </div>
              <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: 3 }}>
                {card.percent}% mục tiêu tháng
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Launchpad({ onNavigate }) {
  return (
    <div className="launchpad">
      <div className="launchpad__header">
        <div>
          <div className="launchpad__title">Trung Tâm Điều Khiển Chức Năng (Launchpad)</div>
          <div className="launchpad__sub">
            Tập hợp các tính năng theo nhóm chuyên biệt theo luồng in DTF & lua công nghiệp.
          </div>
        </div>
        <div className="launchpad__badge">
          <Activity size={10} style={{ display: "inline", marginRight: 4 }} />
          Khaitura AI Sẵn Sàng
        </div>
      </div>

      <div className="launchpad__grid">
        {LAUNCHPAD_CARDS.map(({ id, name, Icon, desc, meta, tag, featured, navigateTo }) => (
          <div
            key={id}
            id={`lp-${id}`}
            className={`lp-card ${featured ? "lp-card--featured" : ""}`}
            onClick={() => navigateTo && onNavigate(navigateTo)}
          >
            {tag && (
              <span className={`lp-card__tag ${tag.cls}`}>{tag.text}</span>
            )}
            <div className="lp-card__icon">
              <Icon size={22} strokeWidth={1.5} />
            </div>
            <div className="lp-card__name">{name}</div>
            <div className="lp-card__desc">{desc}</div>
            <div className="lp-card__meta">
              <span className="lp-card__meta-dot" />
              {meta}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PipelineQueue() {
  return (
    <div className="pipeline">
      <div className="pipeline__header">
        <div>
          <div className="pipeline__title">Tiến trình Hàng đợi Gần nhất (Pipeline)</div>
          <div className="pipeline__sub">
            Tự động giám sát các tác vụ render và kiểm định thuộc thước in.
          </div>
        </div>
        <span className="pipeline__badge badge--auto">Auto-save: 2s</span>
      </div>

      <table className="pipeline__table">
        <thead>
          <tr>
            <th>Tệp Đồ họa</th>
            <th>Quy Tuyến</th>
            <th>Thao Tác</th>
            <th>Trạng Thái</th>
          </tr>
        </thead>
        <tbody>
          {PIPELINE_ROWS.map((row, i) => {
            const s = STATUS_MAP[row.status] ?? STATUS_MAP.pending;
            return (
              <tr key={i}>
                <td>
                  <div className="file-thumb-wrap">
                    <div className="file-thumb" style={{
                      background: `hsl(${i * 60 + 200},30%,18%)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <Image size={14} color="var(--text-muted)" />
                    </div>
                    <div>
                      <div className="file-info__name">{row.name}</div>
                      <div className="file-info__size">{row.size}</div>
                    </div>
                  </div>
                </td>
                <td>{row.dim}</td>
                <td style={{ fontSize: "0.68rem", maxWidth: 120 }}>{row.ops}</td>
                <td>
                  <span className={`status-pill ${s.cls}`}>
                    <s.Icon size={9} style={{ flexShrink: 0 }} />
                    {s.text}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="pipeline__footer" id="pipeline-view-all">
        Xem toàn bộ hàng đợi →
      </div>
    </div>
  );
}

function DevicePanel() {
  return (
    <div className="device-panel">
      <div className="device-card">
        <div className="device-card__header">
          <div className="device-card__title">
            <span className="live-dot" />
            Tình Trạng Thiết Bị & RIP Bridge
          </div>
          <span className="pipeline__badge badge--live">
            <Activity size={9} style={{ display: "inline", marginRight: 3 }} />
            LIVE
          </span>
        </div>

        {DEVICE_ROWS_PRINTER.map(({ label, val, badgeCls, Icon: RowIcon }, i) => (
          <div className="device-row" key={i}>
            <RowIcon size={13} color="var(--text-muted)" style={{ flexShrink: 0, marginRight: 6 }} />
            <span className="device-row__label">{label}</span>
            {badgeCls
              ? <span className={`device-row__badge ${badgeCls}`}>{val}</span>
              : <span className="device-row__val">{val}</span>
            }
          </div>
        ))}

        <div className="device-row">
          <HardDrive size={13} color="var(--text-muted)" style={{ flexShrink: 0, marginRight: 6 }} />
          <span className="device-row__label">Đang trỏ tới thư mục NVMe Cache</span>
          <span className="device-row__val" style={{ fontSize: "0.65rem" }}>
            1s.4 MB · 512 GB (558)
          </span>
        </div>
      </div>

      <div className="tip-card">
        <div className="tip-card__label">
          <Lightbulb size={11} style={{ display: "inline", marginRight: 4 }} />
          Mẹo từ khay tạo lại DTF
        </div>
        Khi "Chalia" đổi 40 trục cần tạo báo cáo in DTF cho. Liên văn trắng trắng lại tệp bản in.
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  DASHBOARD PAGE
// ══════════════════════════════════════════════════════════════════════════════
function DashboardPage({ onNavigate }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Page header */}
      <div className="page-header">
        <h1 className="page-header__greeting">
          Chào buổi sáng, Xưởng In Kỹ Thuật Số Pro
          <BarChart3 size={20} style={{ display: "inline", marginLeft: 8, verticalAlign: "middle", color: "#818cf8" }} />
        </h1>
        <p className="page-header__sub">
          Hệ thống đang hoạt động tổng hợp và đồng bộ tốt với color profile.
          Đồng bộ ICCs và DTF workflow AI + BilterNet v2 Loaded (512MB).
        </p>
        <div className="page-header__actions">
          <button
            id="btn-import-mo"
            className="btn-primary"
            onClick={() => onNavigate("editor")}
          >
            <Upload size={14} />
            Import tệp mô
          </button>
          <button id="btn-batch-dtf" className="btn-secondary">
            <Zap size={14} />
            Bắt đầu Hàng đợi Batch DTF
          </button>
          <button id="btn-open-folder" className="btn-secondary">
            <FolderOpen size={14} />
            Mở thư mục xuất · EnVanter
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <StatCards />

      {/* Launchpad */}
      <Launchpad onNavigate={onNavigate} />

      {/* Bottom: Pipeline + Device */}
      <div className="dashboard-bottom">
        <PipelineQueue />
        <DevicePanel />
      </div>

    </div>
  );
}

export default DashboardPage;

import { useState } from "react";
import "../styles/settings.css";
import {
  Settings, Palette, Cpu, Monitor, FolderOpen, Bell,
  Save, RotateCcw, CheckCircle, Sliders, Printer,
  LogOut, User, Shield, Crown,
} from "lucide-react";
import { useSettings } from "../hooks/useSettings";

// ── Nav items ─────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "giao-dien", Icon: Palette,    label: "Giao diện & Theme"  },
  { id: "hieu-suat", Icon: Cpu,        label: "Hiệu suất & GPU"    },
  { id: "thu-muc",   Icon: FolderOpen, label: "Thư mục & File"     },
  { id: "in-an",     Icon: Printer,    label: "Cài đặt in ấn"      },
  { id: "thong-bao", Icon: Bell,       label: "Thông báo"          },
  { id: "he-thong",  Icon: Monitor,    label: "Thông tin hệ thống" },
];

const THEMES = [
  { id: "indigo", color: "#6366f1" },
  { id: "violet", color: "#8b5cf6" },
  { id: "sky",    color: "#0ea5e9" },
  { id: "teal",   color: "#14b8a6" },
  { id: "rose",   color: "#f43f5e" },
  { id: "amber",  color: "#f59e0b" },
];

// ── Shared sub-components ─────────────────────────────────────────────
function Toggle({ id, checked, onChange }) {
  return (
    <label className="toggle" htmlFor={id}>
      <input id={id} type="checkbox" checked={checked} onChange={onChange} />
      <span className="toggle__track" />
      <span className="toggle__thumb" />
    </label>
  );
}

function SCard({ iconCls, Icon, title, badge, children }) {
  return (
    <div className="s-card">
      <div className="s-card__head">
        <div className={`s-card__icon s-card__icon--${iconCls}`}><Icon size={15} /></div>
        <div className="s-card__title">{title}</div>
        {badge && <span className="s-card__badge">{badge}</span>}
      </div>
      <div className="s-card__body">{children}</div>
    </div>
  );
}

function SRow({ label, sub, children }) {
  return (
    <div className="s-row">
      <div className="s-row__info">
        <div className="s-row__label">{label}</div>
        {sub && <div className="s-row__sub">{sub}</div>}
      </div>
      <div className="s-row__control">{children}</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  PANEL: Giao diện & Theme
// ══════════════════════════════════════════════════════════════════════
function PanelGiaoDien({ s, onChange }) {
  return (
    <>
      <SCard iconCls="purple" Icon={Palette} title="Giao diện & Màu sắc" badge="JLight">
        <SRow label="Chủ đề màu accent" sub="Áp dụng ngay khi click — nhấn Lưu để giữ lại">
          <div className="theme-swatches">
            {THEMES.map((t) => (
              <div key={t.id}
                className={`theme-swatch ${s.accentTheme === t.id ? "selected" : ""}`}
                style={{ background: t.color }}
                onClick={() => onChange("accentTheme", t.id)}
                title={t.id}
              />
            ))}
          </div>
        </SRow>

        <SRow label="Chế độ sáng / tối" sub="Đổi theme toàn app — xem trước ngay lập tức">
          <select className="s-select" value={s.colorMode} onChange={(e) => onChange("colorMode", e.target.value)}>
            <option value="light">☀ Sáng (Light)</option>
            <option value="dark">🌙 Tối (Dark)</option>
            <option value="auto">⚙ Tự động theo hệ thống</option>
          </select>
        </SRow>

        <SRow label="Độ phóng to giao diện (UI Scale)" sub="Kéo để xem trước — lưu để áp dụng">
          <input type="range" className="s-slider" min={80} max={120} step={5}
            value={s.uiScale} onChange={(e) => onChange("uiScale", Number(e.target.value))} />
          <span className="s-val">{s.uiScale}%</span>
        </SRow>

        <SRow label="Font giao diện" sub="Font chữ hiển thị trong toàn app">
          <select className="s-select" value={s.uiFont} onChange={(e) => onChange("uiFont", e.target.value)}>
            <option value="inter">Inter (Mặc định)</option>
            <option value="roboto">Roboto</option>
            <option value="system">System UI</option>
            <option value="mono">JetBrains Mono</option>
          </select>
        </SRow>

        <SRow label="Hiệu ứng animation" sub="Tắt để tăng tốc độ giao diện">
          <Toggle id="toggle-animations" checked={s.animations}
            onChange={() => onChange("animations", !s.animations)} />
        </SRow>

        <SRow label="Sidebar thu gọn (icon only)" sub="Ẩn text, chỉ hiển thị icon">
          <Toggle id="toggle-compact" checked={s.compactSidebar}
            onChange={() => onChange("compactSidebar", !s.compactSidebar)} />
        </SRow>
      </SCard>

      <SCard iconCls="blue" Icon={Monitor} title="Canvas & Preview">
        <SRow label="Nền canvas editor" sub="Màu nền khi xem ảnh trong Editor">
          <select className="s-select" value={s.canvasBg} onChange={(e) => onChange("canvasBg", e.target.value)}>
            <option value="checker">Ô cờ (Transparent)</option>
            <option value="white">Trắng thuần</option>
            <option value="gray">Xám trung tính</option>
            <option value="black">Đen</option>
          </select>
        </SRow>
        <SRow label="Hiển thị thước đo (Ruler)" sub="Thước px/cm trên editor">
          <Toggle id="toggle-ruler" checked={s.showRuler} onChange={() => onChange("showRuler", !s.showRuler)} />
        </SRow>
        <SRow label="Snap to Grid" sub="Hỗ trợ căn chỉnh theo lưới">
          <Toggle id="toggle-snap" checked={s.snapGrid} onChange={() => onChange("snapGrid", !s.snapGrid)} />
        </SRow>
      </SCard>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  PANEL: Hiệu suất & GPU
// ══════════════════════════════════════════════════════════════════════
function PanelHieuSuat({ s, onChange }) {
  return (
    <>
      <SCard iconCls="amber" Icon={Zap} title="Hiệu suất xử lý" badge="RTX 4070">
        <SRow label="GPU Backend" sub="Engine tính toán chính">
          <select className="s-select" value={s.gpuBackend} onChange={(e) => onChange("gpuBackend", e.target.value)}>
            <option value="cuda">CUDA (NVIDIA RTX)</option>
            <option value="directml">DirectML (Windows)</option>
            <option value="cpu">CPU Only (Fallback)</option>
          </select>
        </SRow>
        <SRow label="VRAM tối đa cho AI" sub="Phần VRAM dành cho model inference">
          <input type="range" className="s-slider" min={2} max={12} step={1}
            value={s.vramLimit} onChange={(e) => onChange("vramLimit", Number(e.target.value))} />
          <span className="s-val s-val--blue">{s.vramLimit} GB</span>
        </SRow>
        <SRow label="Số luồng CPU" sub="Tác động đến Queue batch processing">
          <select className="s-select" value={s.cpuThreads} onChange={(e) => onChange("cpuThreads", Number(e.target.value))}>
            {[2, 4, 6, 8, 12, 16].map((n) => <option key={n} value={n}>{n} Threads</option>)}
          </select>
        </SRow>
        <SRow label="Half-precision (FP16)" sub="Tăng tốc AI, giảm VRAM dùng">
          <Toggle id="toggle-fp16" checked={s.fp16} onChange={() => onChange("fp16", !s.fp16)} />
        </SRow>
        <SRow label="Cache model vào RAM" sub="Giữ model AI sau lần đầu load">
          <Toggle id="toggle-cache" checked={s.cacheModel} onChange={() => onChange("cacheModel", !s.cacheModel)} />
        </SRow>
      </SCard>

      <SCard iconCls="green" Icon={HardDrive} title="Bộ nhớ & Cache">
        <SRow label="Thư mục cache tạm" sub="Nơi lưu file render trung gian">
          <input className="s-input" value={s.cachePath} onChange={(e) => onChange("cachePath", e.target.value)} />
        </SRow>
        <SRow label="Giới hạn cache disk" sub="Tự xóa khi vượt ngưỡng">
          <select className="s-select" value={s.cacheLimit} onChange={(e) => onChange("cacheLimit", e.target.value)}>
            <option value="5gb">5 GB</option>
            <option value="10gb">10 GB</option>
            <option value="20gb">20 GB</option>
            <option value="unlimited">Không giới hạn</option>
          </select>
        </SRow>
        <SRow label="Auto-save interval" sub="Tự động lưu phiên làm việc">
          <select className="s-select" value={s.autoSave} onChange={(e) => onChange("autoSave", e.target.value)}>
            <option value="1">1 giây</option>
            <option value="2">2 giây</option>
            <option value="5">5 giây</option>
            <option value="off">Tắt</option>
          </select>
        </SRow>
      </SCard>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  PANEL: Thư mục & File
// ══════════════════════════════════════════════════════════════════════
function PanelThuMuc({ s, onChange }) {
  return (
    <SCard iconCls="blue" Icon={FolderOpen} title="Thư mục xuất & Nhập">
      <SRow label="Thư mục xuất mặc định" sub="Output khi save từ Editor">
        <input className="s-input" value={s.exportDir} onChange={(e) => onChange("exportDir", e.target.value)} />
      </SRow>
      <SRow label="Thư mục import mặc định" sub="Mở hộp thoại tại đây">
        <input className="s-input" value={s.importDir} onChange={(e) => onChange("importDir", e.target.value)} />
      </SRow>
      <SRow label="Hot Folder (Watch)" sub="Tự nhận file khi có tệp mới vào folder">
        <input className="s-input" value={s.hotFolder} onChange={(e) => onChange("hotFolder", e.target.value)} />
      </SRow>
      <SRow label="Định dạng xuất mặc định" sub="PNG, TIFF, PSD...">
        <select className="s-select" value={s.exportFormat} onChange={(e) => onChange("exportFormat", e.target.value)}>
          <option value="png">PNG (Trong suốt)</option>
          <option value="tiff">TIFF 16-bit</option>
          <option value="psd">PSD (Photoshop)</option>
          <option value="jpg">JPEG (In offset)</option>
        </select>
      </SRow>
      <SRow label="DPI xuất mặc định" sub="Dùng cho DTF & in lụa">
        <select className="s-select" value={s.exportDpi} onChange={(e) => onChange("exportDpi", e.target.value)}>
          <option value="72">72 DPI (Web)</option>
          <option value="150">150 DPI</option>
          <option value="300">300 DPI (In chuẩn)</option>
          <option value="600">600 DPI (In lụa cao cấp)</option>
        </select>
      </SRow>
    </SCard>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  PANEL: In ấn
// ══════════════════════════════════════════════════════════════════════
function PanelInAn({ s, onChange }) {
  return (
    <SCard iconCls="rose" Icon={Printer} title="Cài đặt Máy in & RIP">
      <SRow label="Cổng RIP Engine" sub="AcrRIP / CADlink kết nối">
        <input className="s-input" value={s.ripPort} onChange={(e) => onChange("ripPort", e.target.value)} />
      </SRow>
      <SRow label="Tên máy in mặc định" sub="Máy in DTF / Phun lụa">
        <input className="s-input" value={s.printerName} onChange={(e) => onChange("printerName", e.target.value)} />
      </SRow>
      <SRow label="Tự động gửi print sau xử lý" sub="Queue tự in khi job xong">
        <Toggle id="toggle-autoprint" checked={s.autoPrint} onChange={() => onChange("autoPrint", !s.autoPrint)} />
      </SRow>
      <SRow label="Color Profile ICC mặc định" sub="Profile áp dụng khi in DTF">
        <select className="s-select" value={s.iccProfile} onChange={(e) => onChange("iccProfile", e.target.value)}>
          <option value="dtf_standard">DTF Standard</option>
          <option value="srgb">sRGB IEC61966</option>
          <option value="adobe_rgb">Adobe RGB (1998)</option>
          <option value="fogra39">FOGRA39 (Offset)</option>
        </select>
      </SRow>
    </SCard>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  PANEL: Thông báo
// ══════════════════════════════════════════════════════════════════════
function PanelThongBao({ s, onChange }) {
  return (
    <SCard iconCls="amber" Icon={Bell} title="Thông báo & Âm thanh">
      <SRow label="Thông báo khi job hoàn thành" sub="Desktop notification">
        <Toggle id="toggle-notify-done" checked={s.notifyDone} onChange={() => onChange("notifyDone", !s.notifyDone)} />
      </SRow>
      <SRow label="Cảnh báo khi GPU quá nhiệt" sub="Ngưỡng > 80°C">
        <Toggle id="toggle-notify-gpu" checked={s.notifyGpuTemp} onChange={() => onChange("notifyGpuTemp", !s.notifyGpuTemp)} />
      </SRow>
      <SRow label="Âm thanh hoàn thành" sub="Phát beep khi batch xong">
        <Toggle id="toggle-sound" checked={s.soundDone} onChange={() => onChange("soundDone", !s.soundDone)} />
      </SRow>
      <SRow label="Cảnh báo lỗi queue" sub="Alert khi job bị lỗi">
        <Toggle id="toggle-notify-err" checked={s.notifyError} onChange={() => onChange("notifyError", !s.notifyError)} />
      </SRow>
    </SCard>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  PANEL: Thông tin hệ thống
// ══════════════════════════════════════════════════════════════════════
function PanelHeThong() {
  const INFO = [
    { label: "Phiên bản app",  val: "RenGoFun v2.4.0", cls: "s-val--blue"  },
    { label: "Tauri runtime",  val: "2.1.0",            cls: ""             },
    { label: "Python Engine",  val: "3.13.0",           cls: "s-val--green" },
    { label: "GPU (CUDA)",     val: "RTX 4070 / 12.1",  cls: "s-val--amber" },
    { label: "RAM hệ thống",   val: "32 GB DDR5",       cls: ""             },
    { label: "OS",             val: "Windows 11 Pro",   cls: ""             },
    { label: "Bộ nhớ VRAM",    val: "12 GB GDDR6X",     cls: "s-val--blue"  },
    { label: "Tình trạng IPC", val: "Connected",        cls: "s-val--green" },
  ];
  const RESOURCES = [
    { label: "VRAM đang dùng", pct: 27, cls: "purple", val: "3.2 / 12 GB"  },
    { label: "RAM hệ thống",   pct: 52, cls: "blue",   val: "16.6 / 32 GB" },
    { label: "CPU Usage",      pct: 38, cls: "green",  val: "38%"           },
    { label: "Disk I/O",       pct: 15, cls: "amber",  val: "150 MB/s"      },
  ];
  return (
    <>
      <SCard iconCls="slate" Icon={Info} title="Thông tin phần mềm & phần cứng">
        <div className="sys-info-grid">
          {INFO.map(({ label, val, cls }) => (
            <div className="s-row" key={label}>
              <div className="s-row__info"><div className="s-row__label">{label}</div></div>
              <span className={`s-val ${cls}`}>{val}</span>
            </div>
          ))}
        </div>
      </SCard>
      <SCard iconCls="green" Icon={Activity} title="Tài nguyên thời gian thực">
        {RESOURCES.map(({ label, pct, cls, val }) => (
          <SRow key={label} label={label} sub={val}>
            <div className="s-progress">
              <div className={`s-progress__fill s-progress__fill--${cls}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="s-val">{pct}%</span>
          </SRow>
        ))}
      </SCard>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  ACCOUNT CARD — hiển thị thông tin đăng nhập & nút đăng xuất
// ══════════════════════════════════════════════════════════════════════
function AccountCard({ user, onLogout }) {
  const [confirming, setConfirming] = useState(false);

  if (!user) return null;

  const planLabel = user.plan === "pro" ? "Pro" : user.plan === "admin" ? "Admin" : "Free";
  const planColor = user.plan === "pro" ? "#f59e0b" : user.plan === "admin" ? "#6366f1" : "#64748b";

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(139,92,246,0.04) 100%)",
      border: "1px solid rgba(99,102,241,0.18)",
      borderRadius: 12, padding: "14px 16px",
      display: "flex", alignItems: "center", gap: 12,
      marginBottom: 12,
    }}>
      {/* Avatar */}
      <div style={{
        width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
        background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 2px 8px rgba(99,102,241,0.35)",
      }}>
        <User size={18} color="white" />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary,#0f172a)",
          display: "flex", alignItems: "center", gap: 6 }}>
          {user.username}
          <span style={{
            fontSize: "0.65rem", fontWeight: 700, padding: "2px 7px", borderRadius: 20,
            background: `${planColor}22`, color: planColor, border: `1px solid ${planColor}44`,
            display: "flex", alignItems: "center", gap: 3,
          }}>
            {user.plan === "pro" ? <Crown size={9}/> : <Shield size={9}/>}
            {planLabel}
          </span>
        </div>
        <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: 2 }}>
          Đã xác thực · MongoDB Atlas · JWT
        </div>
      </div>

      {/* Logout */}
      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "6px 12px", borderRadius: 8, cursor: "pointer",
            background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)",
            color: "#ef4444", fontSize: "0.72rem", fontWeight: 600,
            transition: "all .2s", flexShrink: 0,
          }}
        >
          <LogOut size={13} /> Đăng xuất
        </button>
      ) : (
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button
            onClick={() => setConfirming(false)}
            style={{
              padding: "6px 10px", borderRadius: 7, cursor: "pointer",
              background: "transparent", border: "1px solid rgba(255,255,255,0.12)",
              color: "#94a3b8", fontSize: "0.72rem", fontWeight: 600,
            }}
          >Huỷ</button>
          <button
            onClick={onLogout}
            style={{
              padding: "6px 12px", borderRadius: 7, cursor: "pointer",
              background: "#ef4444", border: "none",
              color: "white", fontSize: "0.72rem", fontWeight: 700,
            }}
          >Xác nhận</button>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════════════════════════
function SettingsPage({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("giao-dien");
  const { settings, dirty, savedAt, handleChange, handleSave, handleReset } = useSettings();

  const renderPanel = () => {
    switch (activeTab) {
      case "giao-dien": return <PanelGiaoDien s={settings} onChange={handleChange} />;
      case "hieu-suat": return <PanelHieuSuat s={settings} onChange={handleChange} />;
      case "thu-muc":   return <PanelThuMuc   s={settings} onChange={handleChange} />;
      case "in-an":     return <PanelInAn     s={settings} onChange={handleChange} />;
      case "thong-bao": return <PanelThongBao s={settings} onChange={handleChange} />;
      case "he-thong":  return <PanelHeThong />;
      default:          return null;
    }
  };

  const savedTimeStr = savedAt
    ? new Date(savedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="settings-header">
        <div className="settings-header__title">
          <Settings size={20} color="var(--accent, #6366f1)" />
          Cài đặt chung & Tùy chỉnh
        </div>
        <p className="settings-header__sub">
          Thay đổi visual (màu, theme, scale) được <strong>xem trước ngay</strong> — nhấn <strong>Lưu cài đặt</strong> để giữ lại sau khi reload.
        </p>
      </div>

      {/* Body: nav + panels */}
      <div className="settings-body">
        <nav className="settings-nav">
          {NAV_ITEMS.map(({ id, Icon, label }) => (
            <button
              key={id}
              id={`settings-nav-${id}`}
              className={`settings-nav__item ${activeTab === id ? "active" : ""}`}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </nav>

        <div className="settings-panels">
          {renderPanel()}
        </div>
      </div>

      {/* Account Card + Save bar */}
      <div style={{ padding: "0 0 2px" }}>
        <AccountCard user={user} onLogout={onLogout} />
      </div>

      {/* Save bar */}
      <div className="settings-save-bar">
        <div className="settings-save-bar__note">
          {!dirty && savedAt ? (
            <><CheckCircle size={13} color="#16a34a" /> Đã lưu lúc {savedTimeStr} — cài đặt được áp dụng & persist.</>
          ) : dirty ? (
            <><Sliders size={13} /> Có thay đổi chưa lưu — nhấn <strong style={{ margin: "0 3px" }}>Lưu cài đặt</strong> để persist.</>
          ) : (
            <><Sliders size={13} /> Chưa có thay đổi nào.</>
          )}
        </div>
        <div className="settings-save-bar__actions">
          <button id="btn-settings-reset" className="s-btn s-btn--ghost" onClick={handleReset}>
            <RotateCcw size={12} /> Đặt lại mặc định
          </button>
          <button
            id="btn-settings-save"
            className="s-btn s-btn--primary"
            onClick={handleSave}
            disabled={!dirty}
            style={{ opacity: dirty ? 1 : 0.55, cursor: dirty ? "pointer" : "not-allowed" }}
          >
            <Save size={12} /> Lưu cài đặt
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;

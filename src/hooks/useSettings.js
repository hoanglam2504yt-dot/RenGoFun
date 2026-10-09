// ══════════════════════════════════════════════════════════════════════
//  useSettings — Settings engine
//  - Load từ localStorage khi khởi động
//  - Apply CSS variables vào :root ngay khi thay đổi (live preview)
//  - Persist vào localStorage khi user nhấn Save
// ══════════════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "rengofun_settings";

// ── Accent color palettes ──────────────────────────────────────────────
const ACCENT_MAP = {
  indigo: { accent: "#6366f1", accent2: "#818cf8" },
  violet: { accent: "#8b5cf6", accent2: "#a78bfa" },
  sky:    { accent: "#0ea5e9", accent2: "#38bdf8" },
  teal:   { accent: "#14b8a6", accent2: "#2dd4bf" },
  rose:   { accent: "#f43f5e", accent2: "#fb7185" },
  amber:  { accent: "#f59e0b", accent2: "#fbbf24" },
};

// ── Light / Dark token sets ────────────────────────────────────────────
const THEME_MAP = {
  dark: {
    "--bg":            "#0d0d14",
    "--surface":       "#12121c",
    "--card-bg":       "#181826",
    "--border":        "rgba(255,255,255,0.07)",
    "--text-primary":  "#e8eaf6",
    "--text-secondary":"#b0b4d0",
    "--text-muted":    "#6b7280",
  },
  light: {
    "--bg":            "#f1f5f9",
    "--surface":       "#ffffff",
    "--card-bg":       "#f8fafc",
    "--border":        "rgba(0,0,0,0.08)",
    "--text-primary":  "#0f172a",
    "--text-secondary":"#475569",
    "--text-muted":    "#94a3b8",
  },
};

// ── Font map ───────────────────────────────────────────────────────────
const FONT_MAP = {
  inter:  "'Inter', system-ui, -apple-system, sans-serif",
  roboto: "'Roboto', system-ui, sans-serif",
  system: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  mono:   "'JetBrains Mono', 'Fira Code', monospace",
};

// ── Canvas background ──────────────────────────────────────────────────
export const CANVAS_BG_MAP = {
  checker: "repeating-conic-gradient(#cbd5e1 0% 25%, #f8fafc 0% 50%) 0 0 / 16px 16px",
  white:   "#ffffff",
  gray:    "#94a3b8",
  black:   "#000000",
};

// ── Default settings ───────────────────────────────────────────────────
export const DEFAULT_SETTINGS = {
  accentTheme:    "indigo",
  colorMode:      "dark",
  uiScale:        100,
  uiFont:         "inter",
  animations:     true,
  compactSidebar: false,
  canvasBg:       "checker",
  showRuler:      true,
  snapGrid:       false,
  gpuBackend:     "cuda",
  vramLimit:      4,
  cpuThreads:     8,
  fp16:           true,
  cacheModel:     true,
  cachePath:      "C:\\Users\\XUONG\\AppData\\Local\\RenGoFun\\cache",
  cacheLimit:     "10gb",
  autoSave:       "2",
  exportDir:      "D:\\Output\\DTF_Export",
  importDir:      "D:\\Input",
  hotFolder:      "D:\\HotFolder",
  exportFormat:   "png",
  exportDpi:      "300",
  ripPort:        "4148",
  printerName:    "Epson L18050 DTF Roll 20cm",
  autoPrint:      false,
  iccProfile:     "dtf_standard",
  notifyDone:     true,
  notifyGpuTemp:  true,
  soundDone:      false,
  notifyError:    true,
};

// ── Core apply function — ghi CSS variables vào document.documentElement ──
export function applySettings(s) {
  const root = document.documentElement;

  // 1. Resolve color mode (auto → detect system)
  let mode = s.colorMode;
  if (mode === "auto") {
    mode = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  // 2. Apply theme tokens
  const tokens = THEME_MAP[mode] ?? THEME_MAP.dark;
  Object.entries(tokens).forEach(([k, v]) => root.style.setProperty(k, v));

  // 3. Apply accent colors
  const accentPair = ACCENT_MAP[s.accentTheme] ?? ACCENT_MAP.indigo;
  root.style.setProperty("--accent",  accentPair.accent);
  root.style.setProperty("--accent-2", accentPair.accent2);

  // 4. Apply UI scale (font-size trên :root — toàn bộ rem units scale theo)
  root.style.fontSize = `${s.uiScale / 100}rem`;

  // 5. Apply font
  const fontStack = FONT_MAP[s.uiFont] ?? FONT_MAP.inter;
  root.style.setProperty("--font-ui", fontStack);
  root.style.fontFamily = fontStack;

  // 6. Animations — tắt transition/animation toàn cục nếu user tắt
  if (!s.animations) {
    root.style.setProperty("--transition-speed", "0s");
    if (!document.getElementById("_no-anim-style")) {
      const style = document.createElement("style");
      style.id = "_no-anim-style";
      style.textContent = "*, *::before, *::after { transition: none !important; animation: none !important; }";
      document.head.appendChild(style);
    }
  } else {
    root.style.removeProperty("--transition-speed");
    const el = document.getElementById("_no-anim-style");
    if (el) el.remove();
  }

  // 7. Data attribute cho body (có thể dùng CSS selector sau)
  document.body.dataset.theme = mode;
  document.body.dataset.accentTheme = s.accentTheme;
}

// ══════════════════════════════════════════════════════════════════════
//  HOOK
// ══════════════════════════════════════════════════════════════════════
export function useSettings() {
  // Load initial state: localStorage → default
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch (_) { /* ignore */ }
    return { ...DEFAULT_SETTINGS };
  });

  const [savedAt, setSavedAt] = useState(null); // timestamp of last save
  const [dirty, setDirty]   = useState(false);  // unsaved changes?

  // Apply on mount (so settings load on startup)
  useEffect(() => {
    applySettings(settings);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live-preview: apply accent + font + scale as user drags (no save needed)
  const handleChange = useCallback((key, value) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      // Live preview for visual settings only
      const LIVE_PREVIEW_KEYS = [
        "accentTheme", "colorMode", "uiScale", "uiFont", "animations",
      ];
      if (LIVE_PREVIEW_KEYS.includes(key)) {
        applySettings(next);
      }
      return next;
    });
    setDirty(true);
  }, []);

  // Persist to localStorage + full apply
  const handleSave = useCallback(() => {
    applySettings(settings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (_) { /* storage quota exceeded */ }
    setSavedAt(Date.now());
    setDirty(false);
  }, [settings]);

  // Reset to defaults
  const handleReset = useCallback(() => {
    setSettings({ ...DEFAULT_SETTINGS });
    applySettings(DEFAULT_SETTINGS);
    localStorage.removeItem(STORAGE_KEY);
    setDirty(true);
  }, []);

  return {
    settings,
    dirty,
    savedAt,
    handleChange,
    handleSave,
    handleReset,
  };
}

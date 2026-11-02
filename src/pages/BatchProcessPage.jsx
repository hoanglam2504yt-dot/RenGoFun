import { useState, useEffect, useRef, useCallback } from "react";
import "../styles/batchProcess.css";
import { triggerDownloadToast } from "../components/DownloadToast";
import {
  FolderPlus, FilePlus, Trash2, Play, Square, Cpu, Layers, Activity,
  CheckCircle2, Clock, Zap, XCircle, X, Download, Copy, FolderOpen,
  ShieldCheck, RefreshCw, HardDrive, Eye, Scan, Crosshair,
  ToggleLeft, ToggleRight, Sliders, ChevronDown, RotateCcw,
  ZoomIn, ZoomOut, Image as ImageIcon, AlertTriangle,
} from "lucide-react";

export const LOCAL_API_BASE = "http://127.0.0.1:8002";

function createDemoSvg(type, color1 = "#6366f1", color2 = "#ec4899", title = "DTF") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
    <defs>
      <linearGradient id="g_${type}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color1}"/>
        <stop offset="100%" stop-color="${color2}"/>
      </linearGradient>
      <filter id="shadow_${type}">
        <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="${color1}" flood-opacity="0.45"/>
      </filter>
    </defs>
    <rect width="100%" height="100%" fill="none"/>
    <g filter="url(#shadow_${type})">
      ${type === "skull" ? `
        <circle cx="200" cy="180" r="90" fill="url(#g_${type})"/>
        <path d="M160,250 L240,250 L230,290 L170,290 Z" fill="url(#g_${type})"/>
        <circle cx="170" cy="170" r="22" fill="#0d0d14"/>
        <circle cx="230" cy="170" r="22" fill="#0d0d14"/>
      ` : type === "tiger" ? `
        <polygon points="200,100 280,180 250,280 150,280 120,180" fill="url(#g_${type})"/>
        <circle cx="165" cy="190" r="16" fill="#0d0d14"/>
        <circle cx="235" cy="190" r="16" fill="#0d0d14"/>
      ` : type === "wave" ? `
        <circle cx="200" cy="200" r="110" fill="none" stroke="url(#g_${type})" stroke-width="14"/>
        <path d="M100,220 Q150,140 200,210 T300,200 L300,290 L100,290 Z" fill="url(#g_${type})"/>
      ` : type === "chibi" ? `
        <circle cx="200" cy="200" r="85" fill="url(#g_${type})"/>
        <ellipse cx="145" cy="130" rx="30" ry="45" fill="${color1}"/>
        <ellipse cx="255" cy="130" rx="30" ry="45" fill="${color1}"/>
      ` : `
        <rect x="90" y="110" width="220" height="180" rx="18" fill="url(#g_${type})"/>
        <text x="200" y="215" font-family="sans-serif" font-weight="900" font-size="44" fill="#ffffff" text-anchor="middle">${title}</text>
      `}
    </g>
  </svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

const DEFAULT_PIPELINE = {
  dust: true, dustThreshold: 5,
  alphaCutoff: 22, edgeBoost: 45,
  floodFillBg: false, bgTolerance: 35,
  defringe: true, defringeRadius: 2, dehalo: 60,
  choke: true, chokePx: 1.5, erodeSteps: 0,
  usm: true, usmAmount: 120,
  resize: true, longEdgeCm: 30, dpi: 300,
  colorbalance: false,
  colorMode: "RGBA",
};

/**
 * Bảng ánh xạ chuẩn 100% giữa Chế độ xử lý (Preset) và 6 bước Cấu hình Pipeline
 */
const PRESET_OPTIONS = [
  {
    id: "dtf_sharpness_defringe",
    name: "DTF Print Sharpness + Defringe V2",
    defaultPipeline: {
      dust: true, dustThreshold: 5, alphaCutoff: 22, edgeBoost: 45, floodFillBg: false, bgTolerance: 35,
      defringe: true, defringeRadius: 2, dehalo: 60,
      choke: true, chokePx: 1.5, erodeSteps: 0,
      usm: true, usmAmount: 120,
      resize: true, longEdgeCm: 30, dpi: 300,
      colorbalance: false, colorMode: "RGBA",
    },
  },
  {
    id: "clean_edge_4stage",
    name: "Làm sạch nền & viền (4 giai đoạn)",
    defaultPipeline: {
      dust: true, dustThreshold: 5, alphaCutoff: 22, edgeBoost: 45, floodFillBg: false, bgTolerance: 35,
      defringe: true, defringeRadius: 2, dehalo: 60,
      choke: false, chokePx: 1.0, erodeSteps: 0,
      usm: false, usmAmount: 120,
      resize: false, longEdgeCm: 30, dpi: 300,
      colorbalance: false, colorMode: "RGBA",
    },
  },
  {
    id: "flood_fill_clean_edge",
    name: "Tách nền phẳng 4 góc + Làm sạch viền",
    defaultPipeline: {
      dust: true, dustThreshold: 5, alphaCutoff: 22, edgeBoost: 45, floodFillBg: true, bgTolerance: 35,
      defringe: true, defringeRadius: 2, dehalo: 60,
      choke: false, chokePx: 1.0, erodeSteps: 0,
      usm: false, usmAmount: 120,
      resize: false, longEdgeCm: 30, dpi: 300,
      colorbalance: false, colorMode: "RGBA",
    },
  },
  {
    id: "harden_edge",
    name: "Tăng sắc nét viền",
    defaultPipeline: {
      dust: true, dustThreshold: 5, alphaCutoff: 28, edgeBoost: 65, floodFillBg: false, bgTolerance: 35,
      defringe: true, defringeRadius: 1, dehalo: 60,
      choke: false, chokePx: 1.0, erodeSteps: 0,
      usm: true, usmAmount: 180,
      resize: false, longEdgeCm: 30, dpi: 300,
      colorbalance: false, colorMode: "RGBA",
    },
  },
  {
    id: "smooth_contour",
    name: "Làm mượt viền & Xoá đen",
    defaultPipeline: {
      dust: true, dustThreshold: 8, alphaCutoff: 22, edgeBoost: 45, floodFillBg: false, bgTolerance: 35,
      defringe: true, defringeRadius: 3, dehalo: 75,
      choke: true, chokePx: 1.0, erodeSteps: 1,
      usm: false, usmAmount: 100,
      resize: false, longEdgeCm: 30, dpi: 300,
      colorbalance: false, colorMode: "RGBA",
    },
  },
  {
    id: "denoise_deskew",
    name: "Làm sạch tạp âm & Bỏ thẳng",
    defaultPipeline: {
      dust: true, dustThreshold: 15, alphaCutoff: 22, edgeBoost: 45, floodFillBg: false, bgTolerance: 35,
      defringe: true, defringeRadius: 2, dehalo: 60,
      choke: false, chokePx: 1.0, erodeSteps: 0,
      usm: true, usmAmount: 110,
      resize: false, longEdgeCm: 30, dpi: 300,
      colorbalance: false, colorMode: "RGBA",
    },
  },
  {
    id: "grayscale",
    name: "Trắng đen",
    defaultPipeline: {
      dust: true, dustThreshold: 5, alphaCutoff: 22, edgeBoost: 45, floodFillBg: false, bgTolerance: 35,
      defringe: false, defringeRadius: 2, dehalo: 60,
      choke: false, chokePx: 1.0, erodeSteps: 0,
      usm: false, usmAmount: 100,
      resize: false, longEdgeCm: 30, dpi: 300,
      colorbalance: true, colorMode: "RGBA",
    },
  },
  {
    id: "blur_detect",
    name: "Lọc & Dò ảnh mờ nhòe",
    defaultPipeline: {
      dust: false, dustThreshold: 5, alphaCutoff: 22, edgeBoost: 45, floodFillBg: false, bgTolerance: 35,
      defringe: false, defringeRadius: 2, dehalo: 60,
      choke: false, chokePx: 1.0, erodeSteps: 0,
      usm: true, usmAmount: 150,
      resize: false, longEdgeCm: 30, dpi: 300,
      colorbalance: false, colorMode: "RGBA",
    },
  },
  {
    id: "defringe_resize",
    name: "Khử viền + Resize 30cm",
    defaultPipeline: {
      dust: true, dustThreshold: 5, alphaCutoff: 22, edgeBoost: 45, floodFillBg: false, bgTolerance: 35,
      defringe: true, defringeRadius: 2, dehalo: 60,
      choke: false, chokePx: 1.0, erodeSteps: 0,
      usm: false, usmAmount: 120,
      resize: true, longEdgeCm: 30, dpi: 300,
      colorbalance: false, colorMode: "RGBA",
    },
  },
  {
    id: "defringe_choke",
    name: "Defringe + Choke 1px",
    defaultPipeline: {
      dust: true, dustThreshold: 5, alphaCutoff: 22, edgeBoost: 45, floodFillBg: false, bgTolerance: 35,
      defringe: true, defringeRadius: 2, dehalo: 60,
      choke: true, chokePx: 1.0, erodeSteps: 1,
      usm: false, usmAmount: 120,
      resize: false, longEdgeCm: 30, dpi: 300,
      colorbalance: false, colorMode: "RGBA",
    },
  },
];

const PIPELINE_STEP_DEFS = [
  {
    key: "dust", num: 1, name: "Dọn rác & Làm sạch viền Alpha", controls: [
      { label: "Cắt mờ (C)", field: "alphaCutoff", min: 0, max: 150, step: 1, unit: "", type: "range" },
      { label: "Làm rõ viền", field: "edgeBoost", min: 0, max: 95, step: 5, unit: "%", type: "range" },
      { label: "Ngưỡng bụi", field: "dustThreshold", min: 1, max: 50, step: 1, unit: "px", type: "range" },
      { label: "Tách nền 4 góc", field: "floodFillBg", type: "checkbox" },
      { label: "Dung sai nền (T)", field: "bgTolerance", min: 5, max: 100, step: 1, unit: "", type: "range", showIf: "floodFillBg" },
    ]
  },
  {
    key: "defringe", num: 2, name: "Khử viền ám màu (Dehalo 5×5)", controls: [
      { label: "Khử ám màu", field: "dehalo", min: 0, max: 100, step: 5, unit: "%", type: "range" },
      { label: "Bán kính", field: "defringeRadius", min: 1, max: 8, step: 1, unit: "px", type: "range" },
    ]
  },
  {
    key: "choke", num: 3, name: "Co viền bế (Choke / Erode 3×3)", controls: [
      {
        label: "Co mép (S)", field: "erodeSteps", type: "select_custom", options: [
          { value: 0, label: "0 bước (Tắt)" },
          { value: 1, label: "1 bước (3×3)" },
          { value: 2, label: "2 bước (3×3)" },
        ]
      },
      { label: "Độ co", field: "chokePx", min: 0.5, max: 5, step: 0.5, unit: "px", type: "range" },
    ]
  },
  { key: "usm", num: 4, name: "Tăng nét in (USM)", controls: [{ label: "Cường độ", field: "usmAmount", min: 50, max: 300, step: 10, unit: "%", type: "range" }] },
  {
    key: "resize", num: 5, name: "Đổi cỡ & 300 DPI", controls: [
      { label: "Cạnh dài", field: "longEdgeCm", min: 5, max: 150, step: 0.5, unit: "cm", type: "number" },
      { label: "Mật độ", field: "dpi", type: "select", options: [150, 300, 600] },
    ]
  },
  {
    key: "colorbalance", num: 6, name: "Hệ màu & Cân màu / Đen trắng", alwaysShowControls: true, controls: [
      {
        label: "Hệ màu đích", field: "colorMode", type: "select_str", options: [
          { value: "RGBA", label: "RGBA (PNG 32-bit Alpha)" },
          { value: "CMYK", label: "CMYK (Gamut + Alpha PNG)" },
          { value: "CMYK_TIFF", label: "CMYK TIFF (300 DPI RIP)" },
        ]
      },
    ]
  },
];

function getDpiAndColorText(dpi = 300, colorMode = "RGBA") {
  const mode = String(colorMode || "RGBA").toUpperCase();
  if (mode === "CMYK_TIFF") return `${dpi || 300} DPI • CMYK TIFF`;
  if (mode === "CMYK") return `${dpi || 300} DPI • CMYK`;
  return `${dpi || 300} DPI • RGBA`;
}

function getTargetColorModeDescription(colorMode = "RGBA") {
  const mode = String(colorMode || "RGBA").toUpperCase();
  if (mode === "CMYK_TIFF") return "CMYK (TIFF 300 DPI Chuẩn RIP)";
  if (mode === "CMYK") return "CMYK (U.S. Web Coated SWOP v2 + Alpha)";
  return "RGBA (32-bit Alpha)";
}

/**
 * Thực thi Thuật toán Làm sạch nền & viền 4 giai đoạn + Tách nền phẳng 4 góc + Hệ màu CMYK trên Canvas Client
 */
function runClientCleanEdgeAndColorMode(srcUrl, pipelineOpts) {
  return new Promise((resolve) => {
    if (!srcUrl) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const w = Math.min(img.naturalWidth || 512, 1024);
        const h = Math.min(img.naturalHeight || 512, 1024);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        const d = imageData.data; // [R, G, B, A]
        const total = w * h;

        // 0. Tách nền phẳng từ 4 góc bằng Flood Fill nếu bật floodFillBg
        if (pipelineOpts.floodFillBg && w >= 2 && h >= 2) {
          const tol = Math.max(5, Math.min(100, Number(pipelineOpts.bgTolerance ?? 35)));
          const cCoords = [0, (w - 1) * 4, (h - 1) * w * 4, ((h - 1) * w + (w - 1)) * 4];
          let bgR = 0, bgG = 0, bgB = 0;
          for (const ci of cCoords) {
            bgR += d[ci]; bgG += d[ci + 1]; bgB += d[ci + 2];
          }
          bgR /= 4; bgG /= 4; bgB /= 4;

          const visited = new Uint8Array(total);
          const q = [0, w - 1, (h - 1) * w, (h - 1) * w + (w - 1)];
          for (const idx of q) visited[idx] = 1;

          while (q.length > 0) {
            const curr = q.pop();
            const p4 = curr * 4;
            const dist = Math.max(
              Math.abs(d[p4] - bgR),
              Math.abs(d[p4 + 1] - bgG),
              Math.abs(d[p4 + 2] - bgB)
            );
            if (dist <= tol) {
              d[p4 + 3] = 0;
              const cx = curr % w;
              const cy = (curr - cx) / w;
              if (cx > 0 && !visited[curr - 1]) { visited[curr - 1] = 1; q.push(curr - 1); }
              if (cx < w - 1 && !visited[curr + 1]) { visited[curr + 1] = 1; q.push(curr + 1); }
              if (cy > 0 && !visited[curr - w]) { visited[curr - w] = 1; q.push(curr - w); }
              if (cy < h - 1 && !visited[curr + w]) { visited[curr + w] = 1; q.push(curr + w); }
            }
          }
        }

        // Giai đoạn 1 & 2: Cắt ngưỡng mờ & Tăng độ dốc viền phi tuyến
        const cutoff = Math.max(0, Math.min(254, Number(pipelineOpts.alphaCutoff ?? 22)));
        const boost = Math.max(0, Math.min(0.95, Number(pipelineOpts.edgeBoost ?? 45) / 100));
        const power = 1.0 - 0.68 * boost;
        const denom = Math.max(1, 255 - cutoff);

        for (let i = 0; i < d.length; i += 4) {
          const a0 = d[i + 3];
          let a1 = a0 <= cutoff ? 0 : Math.min(255, Math.round(((a0 - cutoff) / denom) * 255));
          let a2 = a1 > 0 && boost > 0
            ? Math.min(255, Math.round(Math.pow(a1 / 255, power) * 255))
            : a1;
          d[i + 3] = a2;
          if (a2 === 0) {
            d[i] = 0; d[i + 1] = 0; d[i + 2] = 0;
          }
        }

        // Giai đoạn 3: Khử ám màu rìa bằng tìm kiếm lân cận 5x5
        const halo = Math.max(0, Math.min(1.0, Number(pipelineOpts.dehalo ?? 60) / 100));
        if (halo > 0 && pipelineOpts.defringe) {
          const orig = new Uint8ClampedArray(d);
          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const idx4 = (y * w + x) * 4;
              const a = orig[idx4 + 3];
              if (a < 5 || a > 220) continue;
              let bestR = orig[idx4], bestG = orig[idx4 + 1], bestB = orig[idx4 + 2], bestA = a;
              for (let dy = -2; dy <= 2; dy++) {
                const ny = y + dy;
                if (ny < 0 || ny >= h) continue;
                for (let dx = -2; dx <= 2; dx++) {
                  const nx = x + dx;
                  if (nx < 0 || nx >= w) continue;
                  const nIdx4 = (ny * w + nx) * 4;
                  const na = orig[nIdx4 + 3];
                  if (na > bestA && na > 150) {
                    bestA = na;
                    bestR = orig[nIdx4];
                    bestG = orig[nIdx4 + 1];
                    bestB = orig[nIdx4 + 2];
                  }
                }
              }
              if (bestA > a) {
                const mix = halo * (1 - a / 320) * 0.68;
                d[idx4] = Math.round(orig[idx4] * (1 - mix) + bestR * mix);
                d[idx4 + 1] = Math.round(orig[idx4 + 1] * (1 - mix) + bestG * mix);
                d[idx4 + 2] = Math.round(orig[idx4 + 2] * (1 - mix) + bestB * mix);
              }
            }
          }
        }

        // Giai đoạn 4: Co mép hình thái học 3x3 (Erosion)
        const erodeSteps = Math.max(0, Math.min(2, Number(pipelineOpts.erodeSteps ?? 0)));
        for (let step = 0; step < erodeSteps; step++) {
          const prevAlpha = new Uint8Array(total);
          for (let p = 0; p < total; p++) prevAlpha[p] = d[p * 4 + 3];
          for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
              const p = y * w + x;
              if (prevAlpha[p] === 0) continue;
              let minNeighbor = 255;
              for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                  if (dx === 0 && dy === 0) continue;
                  const na = prevAlpha[(y + dy) * w + (x + dx)];
                  if (na < minNeighbor) minNeighbor = na;
                }
              }
              if (minNeighbor < prevAlpha[p]) {
                const newA = Math.round(prevAlpha[p] * 0.25 + minNeighbor * 0.75);
                const idx4 = p * 4;
                d[idx4 + 3] = newA;
                if (newA === 0) {
                  d[idx4] = 0; d[idx4 + 1] = 0; d[idx4 + 2] = 0;
                }
              }
            }
          }
        }

        // Chuyển trắng đen giữ Alpha hoặc giả lập không gian màu CMYK (k_pullback = 0.85)
        const isCmyk = String(pipelineOpts.colorMode || "RGBA").toUpperCase().startsWith("CMYK");
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] === 0) continue;
          let r = d[i], g = d[i + 1], b = d[i + 2];
          if (pipelineOpts.colorbalance) {
            const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            d[i] = lum; d[i + 1] = lum; d[i + 2] = lum;
          } else if (isCmyk) {
            const rn = r / 255, gn = g / 255, bn = b / 255;
            const c0 = 1 - rn, m0 = 1 - gn, y0 = 1 - bn;
            const kMin = Math.min(c0, m0, y0);
            const k = kMin * 0.85;
            const denomK = 1 - k < 1e-6 ? 1.0 : 1 - k;
            const c = Math.max(0, Math.min(1, (c0 - k) / denomK));
            const m = Math.max(0, Math.min(1, (m0 - k) / denomK));
            const y = Math.max(0, Math.min(1, (y0 - k) / denomK));
            // Nén nhẹ dải màu rực ngoài gamut sRGB -> CMYK SWOP v2 để mô phỏng trung thực trên màn hình
            d[i] = Math.round(255 * (1 - c * 0.94) * (1 - k));
            d[i + 1] = Math.round(255 * (1 - m * 0.94) * (1 - k));
            d[i + 2] = Math.round(255 * (1 - y * 0.94) * (1 - k));
          }
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (_) {
        resolve(srcUrl);
      }
    };
    img.onerror = () => resolve(srcUrl);
    img.src = srcUrl;
  });
}

function isPipelineCustomizedForPreset(presetId, currentPipeline) {
  const presetObj = PRESET_OPTIONS.find(p => p.id === presetId) || PRESET_OPTIONS[0];
  const def = presetObj.defaultPipeline;
  if (!def || !currentPipeline) return false;
  const toggleKeys = ["dust", "defringe", "choke", "usm", "resize", "colorbalance"];
  for (const k of toggleKeys) {
    if (Boolean(currentPipeline[k]) !== Boolean(def[k])) return true;
  }
  if (currentPipeline.dust && (
    Number(currentPipeline.dustThreshold) !== Number(def.dustThreshold) ||
    Number(currentPipeline.alphaCutoff ?? 22) !== Number(def.alphaCutoff ?? 22) ||
    Number(currentPipeline.edgeBoost ?? 45) !== Number(def.edgeBoost ?? 45) ||
    Boolean(currentPipeline.floodFillBg) !== Boolean(def.floodFillBg)
  )) return true;
  if (currentPipeline.defringe && (
    Number(currentPipeline.defringeRadius) !== Number(def.defringeRadius) ||
    Number(currentPipeline.dehalo ?? 60) !== Number(def.dehalo ?? 60)
  )) return true;
  if (currentPipeline.choke && (
    Number(currentPipeline.chokePx) !== Number(def.chokePx) ||
    Number(currentPipeline.erodeSteps ?? 0) !== Number(def.erodeSteps ?? 0)
  )) return true;
  if (currentPipeline.usm && Number(currentPipeline.usmAmount) !== Number(def.usmAmount)) return true;
  if (currentPipeline.resize && (Number(currentPipeline.longEdgeCm) !== Number(def.longEdgeCm) || Number(currentPipeline.dpi) !== Number(def.dpi))) return true;
  return false;
}

function getSynchronizedPipelineName(presetId, currentPipeline) {
  const presetObj = PRESET_OPTIONS.find(p => p.id === presetId) || PRESET_OPTIONS[0];
  const customized = isPipelineCustomizedForPreset(presetId, currentPipeline);
  return customized ? `${presetObj.name} (Tùy chỉnh)` : presetObj.name;
}

const SAMPLE_QUEUE_ITEMS = [
  { id: "file-01", name: "Skull_Cyber_Print_01.png", previewUrl: createDemoSvg("skull", "#06b6d4", "#6366f1", "SKULL"), processedUrl: null, status: "waiting", subText: "Ảnh mẫu thử nghiệm • Sẵn sàng", dimensions: "2048 × 2048", width: 2048, height: 2048, dpiText: "300 DPI • RGBA", sizeText: "18.4 MB", renderTime: null, alphaClean: 100.0, removedDust: 0, isDemo: true },
  { id: "file-02", name: "Tiger_Retro_DTF_Print.png", previewUrl: createDemoSvg("tiger", "#f59e0b", "#ef4444", "TIGER"), processedUrl: null, status: "waiting", subText: "Ảnh mẫu thử nghiệm • Sẵn sàng", dimensions: "3500 × 4200", width: 3500, height: 4200, dpiText: "300 DPI • RGBA", sizeText: "32.1 MB", renderTime: null, alphaClean: 100.0, removedDust: 142, isDemo: true },
  { id: "file-03", name: "Waves_Japanese_Aesthetic.png", previewUrl: createDemoSvg("wave", "#3b82f6", "#10b981", "WAVE"), processedUrl: null, status: "waiting", subText: "Ảnh mẫu thử nghiệm • Sẵn sàng", dimensions: "2400 × 2400", width: 2400, height: 2400, dpiText: "300 DPI • RGBA", sizeText: "12.8 MB", renderTime: null, alphaClean: 100.0, removedDust: 87, isDemo: true },
  { id: "file-04", name: "Chibi_Mascot_Sticker_Set.png", previewUrl: createDemoSvg("chibi", "#ec4899", "#8b5cf6", "CHIBI"), processedUrl: null, status: "waiting", subText: "Ảnh mẫu thử nghiệm • Sẵn sàng", dimensions: "4096 × 4096", width: 4096, height: 4096, dpiText: "300 DPI • RGBA", sizeText: "44.6 MB", renderTime: null, alphaClean: 100.0, removedDust: 203, isDemo: true },
  { id: "file-05", name: "Streetwear_Typography_09.png", previewUrl: createDemoSvg("text", "#64748b", "#94a3b8", "STREET"), processedUrl: null, status: "waiting", subText: "Đang chờ luồng trống...", dimensions: "1800 × 3600", width: 1800, height: 3600, dpiText: "300 DPI • RGBA", sizeText: "15.2 MB", renderTime: null, alphaClean: 98.4, removedDust: 0, isDemo: true },
  { id: "file-06", name: "Botanical_Floral_Linework.png", previewUrl: createDemoSvg("text", "#10b981", "#059669", "FLORAL"), processedUrl: null, status: "waiting", subText: "Đang chờ luồng trống...", dimensions: "3000 × 3000", width: 3000, height: 3000, dpiText: "300 DPI • RGBA", sizeText: "21.5 MB", renderTime: null, alphaClean: 97.8, removedDust: 0, isDemo: true },
];

const BG_OPTIONS = [
  { id: "checker", label: "Caro" },
  { id: "black", label: "Đen", style: "#000" },
  { id: "white", label: "Trắng", style: "#fff" },
];

const BATCH_CONFIG_STORAGE_KEY = "rengofun_batch_config_v1";

export default function BatchProcessPage({ isActive = true }) {
  const [queue, setQueue] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [workerThreads, setWorkerThreads] = useState(4);
  const [autoOpenFolder, setAutoOpenFolder] = useState(true);
  const [preset, setPreset] = useState("dtf_sharpness_defringe");
  const [exportPath, setExportPath] = useState("D:/RenGoFun_Exports/DTF_Batch_04");
  const [pipeline, setPipeline] = useState(DEFAULT_PIPELINE);
  const [isPipelineOpen, setIsPipelineOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [speedFps, setSpeedFps] = useState(0);
  const [estTimeLeft, setEstTimeLeft] = useState(0);
  const cancelRef = useRef(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [inspectorBg, setInspectorBg] = useState("checker");
  const [xrayMode, setXrayMode] = useState(false);
  const [xrayCanvasUrl, setXrayCanvasUrl] = useState(null);
  const [apiConnected, setApiConnected] = useState(false);
  const [hwMetrics, setHwMetrics] = useState({
    cpu_percent: 34.0, cpu_cores: 8, cpu_threads: 12,
    ram_total_gb: 15.7, ram_used_gb: 13.1, ram_percent: 83.5,
    gpu_name: "Intel(R) UHD Graphics", gpu_percent: 42.0,
    vram_total_gb: 2.0, vram_used_gb: 0.8,
    engine_status: "All Passes Healthy", engine_errors: 0,
    cuda_ready: true, backend_version: "v2.4.1-cu121",
  });
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const pipelinePopoverRef = useRef(null);
  const wsRef = useRef(null);
  const hwFailCountRef = useRef(0);
  const isRunningRef = useRef(false);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  // Tên Pipeline đồng bộ 100% với Chế độ xử lý + trạng thái (Tùy chỉnh)
  const currentPipelineLabel = getSynchronizedPipelineName(preset, pipeline);
  const activeStepCount = PIPELINE_STEP_DEFS.filter(s => Boolean(pipeline[s.key])).length;

  // Đóng Popover Cấu hình Pipeline khi click ra ngoài hoặc nhấn phím Escape
  useEffect(() => {
    if (!isPipelineOpen) return;
    const handleOutsideClick = (e) => {
      if (pipelinePopoverRef.current && !pipelinePopoverRef.current.contains(e.target)) {
        setIsPipelineOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === "Escape") setIsPipelineOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isPipelineOpen]);

  // Khôi phục cấu hình cục bộ & hàng đợi thực tế từ SQLite (GET /api/batch/current) khi khởi động lần đầu
  useEffect(() => {
    let isMounted = true;
    let initialPreset = "dtf_sharpness_defringe";
    let initialPipeline = DEFAULT_PIPELINE;

    try {
      const savedCfg = localStorage.getItem(BATCH_CONFIG_STORAGE_KEY);
      if (savedCfg) {
        const parsed = JSON.parse(savedCfg);
        if (parsed.exportPath) setExportPath(parsed.exportPath);
        if (parsed.workerThreads) setWorkerThreads(Number(parsed.workerThreads) || 4);
        if (typeof parsed.autoOpenFolder === "boolean") setAutoOpenFolder(parsed.autoOpenFolder);
        if (parsed.preset && PRESET_OPTIONS.some(p => p.id === parsed.preset)) {
          initialPreset = parsed.preset;
          setPreset(parsed.preset);
        }
        if (parsed.pipeline) {
          initialPipeline = { ...DEFAULT_PIPELINE, ...parsed.pipeline };
          setPipeline(initialPipeline);
        }
      }
    } catch (_) { }

    const recoverFromSqlite = async () => {
      try {
        const res = await fetch(`${LOCAL_API_BASE}/api/batch/current`);
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted) return;
        setApiConnected(true);
        let syncedPreset = initialPreset;
        let syncedPipeline = initialPipeline;

        if (data.job) {
          if (data.job.export_dir) setExportPath(data.job.export_dir);
          if (data.job.worker_threads) setWorkerThreads(Number(data.job.worker_threads) || 4);
          if (data.job.preset_config_json) {
            try {
              const cfg = typeof data.job.preset_config_json === "string"
                ? JSON.parse(data.job.preset_config_json)
                : data.job.preset_config_json;
              if (cfg.preset && PRESET_OPTIONS.some(p => p.id === cfg.preset)) {
                syncedPreset = cfg.preset;
                setPreset(cfg.preset);
              }
              syncedPipeline = {
                ...syncedPipeline,
                dust: cfg.dust !== undefined ? cfg.dust : syncedPipeline.dust,
                dustThreshold: cfg.dustThreshold ?? syncedPipeline.dustThreshold,
                alphaCutoff: cfg.alphaCutoff ?? cfg.alpha_cutoff ?? syncedPipeline.alphaCutoff ?? 22,
                edgeBoost: cfg.edgeBoost ?? cfg.edge_boost ?? syncedPipeline.edgeBoost ?? 45,
                floodFillBg: cfg.floodFillBg ?? cfg.flood_fill_bg ?? syncedPipeline.floodFillBg ?? false,
                bgTolerance: cfg.bgTolerance ?? cfg.bg_tolerance ?? syncedPipeline.bgTolerance ?? 35,
                defringe: cfg.defringe !== undefined ? cfg.defringe : syncedPipeline.defringe,
                defringeRadius: cfg.defringeRadius ?? syncedPipeline.defringeRadius,
                dehalo: cfg.dehalo ?? syncedPipeline.dehalo ?? 60,
                choke: cfg.choke !== undefined ? cfg.choke : syncedPipeline.choke,
                chokePx: cfg.chokePx ?? cfg.choke_px ?? syncedPipeline.chokePx,
                erodeSteps: cfg.erodeSteps ?? cfg.erode_steps ?? syncedPipeline.erodeSteps ?? 0,
                usm: cfg.usm !== undefined ? cfg.usm : syncedPipeline.usm,
                usmAmount: cfg.usmAmount ?? syncedPipeline.usmAmount,
                resize: cfg.resize !== undefined ? cfg.resize : syncedPipeline.resize,
                longEdgeCm: cfg.longEdgeCm ?? syncedPipeline.longEdgeCm,
                dpi: cfg.dpi ?? syncedPipeline.dpi,
                colorbalance: cfg.colorbalance !== undefined ? cfg.colorbalance : syncedPipeline.colorbalance,
                colorMode: cfg.colorMode || cfg.color_mode || syncedPipeline.colorMode || "RGBA",
              };
              setPipeline(syncedPipeline);
            } catch (_) { }
          }
        }
        const syncedLabel = getSynchronizedPipelineName(syncedPreset, syncedPipeline);
        const syncedDpiColor = getDpiAndColorText(syncedPipeline.dpi, syncedPipeline.colorMode);

        if (Array.isArray(data.items) && data.items.length > 0) {
          const recoveredQueue = data.items.map((r) => {
            const w = r.orig_width || 0;
            const h = r.orig_height || 0;
            const rawBytes = r.file_size_bytes || r.orig_size_bytes || 0;
            const sizeMB = rawBytes > 0 ? (rawBytes / (1024 * 1024)).toFixed(1) + " MB" : "—";
            const st = r.status === "completed" ? "done" : "waiting";
            const procMs = r.process_time_ms || r.render_time_ms || 0;
            const rTime = procMs > 0 ? procMs / 1000 : null;
            const fname = r.file_name || r.filename || `file_${r.id}.png`;
            return {
              id: `db-item-${r.id}`,
              dbId: r.id,
              name: fname,
              originalFile: null,
              inputPath: r.input_path,
              outputPath: r.output_path,
              previewUrl: `${LOCAL_API_BASE}/api/inspector/preview?file_id=${r.id}&mode=original`,
              processedUrl: st === "done" ? `${LOCAL_API_BASE}/api/inspector/preview?file_id=${r.id}&mode=normal&t=${procMs || 1}` : null,
              status: st,
              subText: st === "done"
                ? `${(rTime || 0.24).toFixed(2)}s render • SQLite`
                : "Khôi phục từ SQLite Queue...",
              dimensions: w > 0 && h > 0 ? `${w} × ${h}` : "Tự động nhận diện",
              width: w,
              height: h,
              dpiText: syncedDpiColor,
              sizeText: sizeMB,
              pipelineText: syncedLabel,
              renderTime: rTime,
              alphaClean: r.alpha_clean_pct ?? 100.0,
              removedDust: r.removed_dust_count ?? r.removed_dust_blobs ?? 0,
              isDemo: false,
            };
          });
          setQueue(recoveredQueue);
          setSelectedId(recoveredQueue[0].id);
        } else {
          setQueue(prev => prev.length > 0 ? prev : []);
        }
      } catch (_) { }
    };
    recoverFromSqlite();
    return () => { isMounted = false; };
  }, []);

  // Lưu cấu hình Pipeline & đường dẫn đích vào localStorage mỗi khi thay đổi
  useEffect(() => {
    try {
      localStorage.setItem(BATCH_CONFIG_STORAGE_KEY, JSON.stringify({
        exportPath,
        workerThreads,
        autoOpenFolder,
        preset,
        pipeline,
      }));
    } catch (_) { }
  }, [exportPath, workerThreads, autoOpenFolder, preset, pipeline]);

  // Đồng bộ tức thì cột PIPELINE ƯU TIÊN & ĐỘ PHÂN GIẢI (DPI + Hệ màu) của các file trong hàng đợi
  useEffect(() => {
    const dpiColorStr = getDpiAndColorText(pipeline.dpi, pipeline.colorMode);
    setQueue(prev => prev.map(item => (
      item.status !== "processing"
        ? { ...item, pipelineText: currentPipelineLabel, dpiText: dpiColorStr }
        : item
    )));
  }, [currentPipelineLabel, pipeline.dpi, pipeline.colorMode]);

  // HW Monitoring & Kiểm tra trạng thái kết nối FastAPI Backend thời gian thực
  useEffect(() => {
    let isMounted = true;
    const fetch_hw = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      try {
        const res = await fetch(`${LOCAL_API_BASE}/system-metrics`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            hwFailCountRef.current = 0;
            setApiConnected(true);
            setHwMetrics(prev => ({
              ...prev, ...data,
              vram_total_gb: data.vram_total_gb > 0 ? data.vram_total_gb : 12.0,
              vram_used_gb: data.vram_used_gb > 0 ? data.vram_used_gb : 2.8,
            }));
          }
        } else if (isMounted) {
          hwFailCountRef.current += 1;
          if (!isRunningRef.current && hwFailCountRef.current >= 2) {
            setApiConnected(false);
          }
        }
      } catch (_) {
        clearTimeout(timeoutId);
        if (isMounted) {
          hwFailCountRef.current += 1;
          // Khi đang xử lý ảnh nặng (isRunningRef.current === true), không báo mất kết nối giả
          // trừ khi chính request xử lý ảnh bị lỗi mạng hoặc đã mất phản hồi liên tiếp >= 3 lần (18s)
          if ((!isRunningRef.current && hwFailCountRef.current >= 2) || hwFailCountRef.current >= 3) {
            setApiConnected(false);
          }
        }
      }
    };
    fetch_hw();
    const iv = setInterval(fetch_hw, 2500);
    return () => { isMounted = false; clearInterval(iv); };
  }, []);

  // WebSocket
  useEffect(() => {
    try {
      const ws = new WebSocket(`ws://127.0.0.1:8002/ws/batch-progress`);
      ws.onopen = () => setApiConnected(true);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "progress") {
            setSpeedFps(data.speed_fps || 0);
            const left = (data.total || 0) - (data.done || 0);
            if (data.speed_fps > 0) setEstTimeLeft(Math.round(left / data.speed_fps * 10) / 10);
          } else if (data.type === "completed") {
            setIsRunning(false);
          }
        } catch (_) { }
      };
      ws.onerror = () => { };
      wsRef.current = ws;
    } catch (_) { }
    return () => { wsRef.current?.close(); };
  }, []);

  // Keyboard shortcuts (chỉ kích hoạt khi tab BatchProcessPage đang hiển thị)
  useEffect(() => {
    if (!isActive) return;
    const kd = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
      if (e.code === "Space" && !e.repeat) { e.preventDefault(); setIsComparing(true); }
      if (e.key === "F5") { e.preventDefault(); toggleBatchProcess(); }
      if (e.key === "m" || e.key === "M") setXrayMode(p => !p);
    };
    const ku = (e) => { if (e.code === "Space") { e.preventDefault(); setIsComparing(false); } };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, [isActive, isRunning, queue]);

  const totalFiles = queue.length;
  const doneFiles = queue.filter(f => f.status === "done").length;
  const processingFiles = queue.filter(f => f.status === "processing").length;
  const waitingFiles = queue.filter(f => f.status === "waiting").length;
  const errorFiles = queue.filter(f => f.status === "error").length;
  const progressPercent = totalFiles > 0 ? Math.round((doneFiles / totalFiles) * 100) : 0;
  const selectedItem = queue.find(f => f.id === selectedId) || queue[0] || null;

  // Render X-Ray Image (Backend /api/inspector/preview?mode=xray for SQLite items, or pixel-exact [85, 0, 255] BGR canvas for in-memory/demo items)
  useEffect(() => {
    if (!xrayMode || !selectedItem) {
      setXrayCanvasUrl(null);
      return;
    }
    if (selectedItem.dbId) {
      setXrayCanvasUrl(`${LOCAL_API_BASE}/api/inspector/preview?file_id=${selectedItem.dbId}&mode=xray&t=${selectedItem.renderTime || 0}`);
      return;
    }
    let cancelled = false;
    const srcToInspect = selectedItem.processedUrl || selectedItem.previewUrl;
    if (!srcToInspect) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      try {
        const w = Math.min(img.naturalWidth || 400, 1024);
        const h = Math.min(img.naturalHeight || 400, 1024);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        const d = imageData.data;
        for (let i = 0; i < d.length; i += 4) {
          const a = d[i + 3];
          if (a === 0) {
            d[i] = 0; d[i + 1] = 0; d[i + 2] = 0; d[i + 3] = 255;
          } else if (a < 255) {
            // Neon red [85, 0, 255] in BGR => R=255, G=0, B=85
            d[i] = 255; d[i + 1] = 0; d[i + 2] = 85; d[i + 3] = 255;
          } else {
            d[i] = Math.round(d[i] * 0.22);
            d[i + 1] = Math.round(d[i + 1] * 0.22);
            d[i + 2] = Math.round(d[i + 2] * 0.22);
            d[i + 3] = 255;
          }
        }
        ctx.putImageData(imageData, 0, 0);
        if (!cancelled) setXrayCanvasUrl(canvas.toDataURL("image/png"));
      } catch (_) {
        if (!cancelled) setXrayCanvasUrl(null);
      }
    };
    img.src = srcToInspect;
    return () => { cancelled = true; };
  }, [xrayMode, selectedItem?.id, selectedItem?.dbId, selectedItem?.processedUrl, selectedItem?.previewUrl, selectedItem?.renderTime]);

  const filteredQueue = queue.filter(f => {
    if (activeTab === "done") return f.status === "done";
    if (activeTab === "processing") return f.status === "processing";
    if (activeTab === "waiting") return f.status === "waiting";
    if (activeTab === "error") return f.status === "error";
    return true;
  });

  // Đổi Chế độ xử lý (Preset) -> đồng bộ ngay 6 bước trong Cấu hình Pipeline + cột PIPELINE ƯU TIÊN
  const handlePresetChange = (newPresetId) => {
    setPreset(newPresetId);
    const targetPreset = PRESET_OPTIONS.find(p => p.id === newPresetId);
    if (targetPreset && targetPreset.defaultPipeline) {
      setPipeline(prev => ({ ...targetPreset.defaultPipeline, colorMode: prev.colorMode || "RGBA" }));
    }
    if (!isRunning) {
      setQueue(prev => prev.map(item => (
        item.status === "error"
          ? { ...item, status: "waiting", subText: "Đang chờ luồng trống..." }
          : item
      )));
      if (activeTab === "error") setActiveTab("all");
    }
  };

  // Khôi phục thông số mặc định của Chế độ xử lý hiện tại trong Popover
  const handleResetPipelineToPreset = () => {
    const targetPreset = PRESET_OPTIONS.find(p => p.id === preset) || PRESET_OPTIONS[0];
    if (targetPreset && targetPreset.defaultPipeline) {
      setPipeline(prev => ({ ...targetPreset.defaultPipeline, colorMode: prev.colorMode || "RGBA" }));
    }
  };

  const toggleStep = (key) => setPipeline(prev => ({ ...prev, [key]: !prev[key] }));
  const setStepVal = (key, val) => setPipeline(prev => ({ ...prev, [key]: val }));

  const handleOpenExportFolder = async (targetPath = exportPath) => {
    try {
      await fetch(`${LOCAL_API_BASE}/api/system/open-folder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: targetPath }),
      });
    } catch (_) { }
  };

  const handlePickExportFolder = async () => {
    try {
      const res = await fetch(`${LOCAL_API_BASE}/api/system/pick-folder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scan_images: false, title: "Chọn thư mục xuất file DTF" }),
      });
      if (res.ok) {
        const data = await res.json();
        const picked = data.folder_path || data.path;
        if (!data.cancelled && picked) {
          setExportPath(picked.replace(/\\/g, "/"));
        }
      }
    } catch (_) { }
  };

  const handleFilesAdded = useCallback(async (e) => {
    const rawFiles = Array.from(e.target.files || []);
    if (rawFiles.length === 0) return;
    const batchTs = Date.now();
    const activeLabel = getSynchronizedPipelineName(preset, pipeline);
    const activeDpiColor = getDpiAndColorText(pipeline.dpi, pipeline.colorMode);
    const newItems = rawFiles.map((file, idx) => {
      const url = URL.createObjectURL(file);
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1) + " MB";
      const itemId = `file-${batchTs}-${idx}`;
      const item = {
        id: itemId, dbId: null, name: file.name, originalFile: file,
        previewUrl: url, processedUrl: null, status: "waiting",
        subText: "Đang chờ luồng trống...", dimensions: "Đang tính...",
        width: 0, height: 0, dpiText: activeDpiColor,
        sizeText: sizeMB, pipelineText: activeLabel,
        renderTime: null, alphaClean: 100.0, removedDust: 0, isDemo: false,
      };
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth, h = img.naturalHeight;
        try {
          const canvas = document.createElement("canvas");
          canvas.width = Math.min(w, 256); canvas.height = Math.min(h, 256);
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          let semiCount = 0;
          const totalPix = canvas.width * canvas.height;
          for (let p = 3; p < imgData.length; p += 4) { const a = imgData[p]; if (a > 0 && a < 255) semiCount++; }
          const cleanPct = totalPix > 0 ? Math.max(0, 100 - (semiCount / totalPix) * 100) : 100;
          setQueue(prev => prev.map(q => q.id === itemId ? { ...q, dimensions: `${w} × ${h}`, width: w, height: h, alphaClean: parseFloat(cleanPct.toFixed(1)) } : q));
        } catch (_) {
          setQueue(prev => prev.map(q => q.id === itemId ? { ...q, dimensions: `${w} × ${h}`, width: w, height: h } : q));
        }
      };
      img.src = url;
      return item;
    });
    setQueue(prev => {
      const nonDemo = prev.every(p => p.isDemo) ? [] : prev;
      return [...nonDemo, ...newItems];
    });
    if (newItems.length > 0) setSelectedId(newItems[0].id);
    e.target.value = "";

    // Sync added files to SQLite Queue via /api/batch/scan
    try {
      const scanForm = new FormData();
      rawFiles.forEach(f => scanForm.append("files", f));
      const res = await fetch(`${LOCAL_API_BASE}/api/batch/scan`, { method: "POST", body: scanForm });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.items)) {
          setQueue(prev => prev.map(q => {
            const matchIdx = newItems.findIndex(ni => ni.id === q.id);
            if (matchIdx !== -1 && data.items[matchIdx]) {
              const dbItem = data.items[matchIdx];
              return { ...q, dbId: dbItem.id, inputPath: dbItem.input_path };
            }
            return q;
          }));
        }
      }
    } catch (_) { }
  }, [preset, pipeline]);

  const handleLoadSampleData = () => {
    if (isRunning) return;
    const activeLabel = getSynchronizedPipelineName(preset, pipeline);
    const activeDpiColor = getDpiAndColorText(pipeline.dpi, pipeline.colorMode);
    const clonedSamples = SAMPLE_QUEUE_ITEMS.map(item => ({
      ...item,
      pipelineText: activeLabel,
      dpiText: activeDpiColor,
    }));
    setQueue(clonedSamples);
    setSelectedId(clonedSamples[0]?.id || null);
  };

  const handleClearQueue = async () => {
    if (isRunning) return;
    setQueue([]);
    setSelectedId(null);
    setSpeedFps(0);
    setEstTimeLeft(0);
    try {
      await fetch(`${LOCAL_API_BASE}/api/batch/clear`, { method: "DELETE" });
    } catch (_) { }
  };

  const handleRemoveItem = async (id, e) => {
    e.stopPropagation();
    if (isRunning) return;
    const targetItem = queue.find(item => item.id === id);
    setQueue(prev => {
      const next = prev.filter(item => item.id !== id);
      if (selectedId === id) setSelectedId(next[0]?.id || null);
      return next;
    });
    if (targetItem?.dbId) {
      try {
        await fetch(`${LOCAL_API_BASE}/api/batch/item/${targetItem.dbId}`, { method: "DELETE" });
      } catch (_) { }
    }
  };

  const processSingleItem = async (item) => {
    const t0 = performance.now();
    const activeTag = getSynchronizedPipelineName(preset, pipeline);
    const activeDpiColor = getDpiAndColorText(pipeline.dpi, pipeline.colorMode);
    setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: "processing", subText: "Pass 1: BGRA Matrix Processing...", pipelineText: activeTag, dpiText: activeDpiColor } : q));
    let processedUrl = item.processedUrl;
    let renderTimeSec = 0.24;
    let alphaCleanVal = 100.0;
    let dimStr = item.dimensions;
    let outW = item.width;
    let outH = item.height;
    let dustCount = item.removedDust || 0;
    let itemSubText = null;

    if (item.originalFile || item.dbId) {
      try {
        const formData = new FormData();
        if (item.originalFile) {
          formData.append("file", item.originalFile);
        }
        formData.append("preset", preset);
        formData.append("dust_enabled", String(Boolean(pipeline.dust)));
        formData.append("dust_threshold", String(pipeline.dustThreshold ?? 5));
        formData.append("alpha_cutoff", String(pipeline.alphaCutoff ?? 22));
        formData.append("edge_boost", String(pipeline.edgeBoost ?? 45));
        formData.append("flood_fill_bg", String(Boolean(pipeline.floodFillBg)));
        formData.append("bg_tolerance", String(pipeline.bgTolerance ?? 35));
        formData.append("force_flood_fill", "false");
        formData.append("defringe_enabled", String(Boolean(pipeline.defringe)));
        formData.append("defringe_radius", String(pipeline.defringeRadius ?? 2));
        formData.append("dehalo", String(pipeline.dehalo ?? 60));
        formData.append("choke_enabled", String(Boolean(pipeline.choke)));
        formData.append("choke_px", String(pipeline.chokePx ?? 1.5));
        formData.append("erode_steps", String(pipeline.erodeSteps ?? 0));
        formData.append("usm_enabled", String(Boolean(pipeline.usm)));
        formData.append("usm_amount", String(pipeline.usmAmount ?? 120));
        formData.append("resize_enabled", String(Boolean(pipeline.resize)));
        formData.append("long_edge_cm", String(pipeline.longEdgeCm ?? 30));
        formData.append("dpi", String(pipeline.dpi ?? 300));
        formData.append("colorbalance", String(Boolean(pipeline.colorbalance)));
        formData.append("color_mode", String(pipeline.colorMode || "RGBA"));
        formData.append("export_dir", exportPath || "");
        formData.append("item_db_id", String(item.dbId || 0));

        const res = await fetch(`${LOCAL_API_BASE}/process-batch-item`, { method: "POST", body: formData });
        if (res.ok) {
          hwFailCountRef.current = 0;
          setApiConnected(true);
          const blob = await res.blob();
          processedUrl = URL.createObjectURL(blob);
          const ht = res.headers.get("X-Render-Time");
          const hr = res.headers.get("X-Resolution");
          const hc = res.headers.get("X-Alpha-Clean");
          const hb = res.headers.get("X-Blur-Score");
          const hd = res.headers.get("X-Removed-Dust");
          renderTimeSec = ht ? parseFloat(ht) : (performance.now() - t0) / 1000;
          if (hr) {
            dimStr = hr.replace("x", " × ");
            const parts = hr.split("x").map(s => parseInt(s.trim(), 10));
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
              outW = parts[0];
              outH = parts[1];
            }
          }
          if (hc) alphaCleanVal = parseFloat(hc);
          if (hd && !isNaN(parseInt(hd, 10))) dustCount = parseInt(hd, 10);
          if (hb) {
            const bScore = parseFloat(hb);
            itemSubText = bScore < 100
              ? `Cảnh báo mờ nhòe (Laplacian: ${bScore.toFixed(1)})`
              : `Đạt chuẩn nét (Laplacian: ${bScore.toFixed(1)})`;
          }
        } else {
          hwFailCountRef.current = 0;
          setApiConnected(true);
          let errMsg = "Lỗi xử lý tệp trên FastAPI";
          try {
            const errJson = await res.json();
            if (errJson?.error) errMsg = errJson.error;
          } catch (_) { }
          setQueue(prev => prev.map(q => q.id === item.id ? {
            ...q, status: "error", subText: errMsg, pipelineText: activeTag, dpiText: activeDpiColor,
          } : q));
          return;
        }
      } catch (_) {
        // Không kết nối được tới FastAPI Backend -> báo lỗi thật, dừng tiến trình thay vì báo Hoàn tất giả
        setApiConnected(false);
        cancelRef.current = true;
        setQueue(prev => prev.map(q => q.id === item.id ? {
          ...q, status: "error", subText: "Lỗi: Không kết nối được FastAPI Backend", pipelineText: activeTag, dpiText: activeDpiColor,
        } : q));
        return;
      }
    } else {
      await new Promise(r => setTimeout(r, 120 + Math.random() * 100));
      const clientProcessed = await runClientCleanEdgeAndColorMode(item.previewUrl, pipeline);
      renderTimeSec = (performance.now() - t0) / 1000;
      processedUrl = clientProcessed || item.processedUrl || item.previewUrl;
      dustCount = item.removedDust || Math.floor(Math.random() * 200);
      if ((preset === "defringe_resize" || pipeline.resize) && outW > 0 && outH > 0) {
        const targetPx = Math.round(((pipeline.longEdgeCm || 30) / 2.54) * (pipeline.dpi || 300));
        if (outW >= outH) {
          outH = Math.max(1, Math.round(outH * (targetPx / outW)));
          outW = targetPx;
        } else {
          outW = Math.max(1, Math.round(outW * (targetPx / outH)));
          outH = targetPx;
        }
        dimStr = `${outW} × ${outH}`;
      } else if (preset === "blur_detect") {
        itemSubText = "Đạt chuẩn nét (Laplacian: 248.5)";
      }
    }
    if (!itemSubText) itemSubText = `${renderTimeSec.toFixed(2)}s render • ${String(pipeline.colorMode || "RGBA").toUpperCase()}`;
    setQueue(prev => prev.map(q => q.id === item.id ? {
      ...q, status: "done", processedUrl, renderTime: renderTimeSec,
      subText: itemSubText, dimensions: dimStr, width: outW, height: outH,
      alphaClean: alphaCleanVal, removedDust: dustCount, pipelineText: activeTag, dpiText: activeDpiColor,
    } : q));
  };

  const toggleBatchProcess = async () => {
    if (isRunning) { cancelRef.current = true; setIsRunning(false); return; }
    if (queue.length === 0) return;

    const hasRealFiles = queue.some(f => !f.isDemo);
    if (hasRealFiles) {
      try {
        const pingCtrl = new AbortController();
        const pingTimer = setTimeout(() => pingCtrl.abort(), 4000);
        const pingRes = await fetch(`${LOCAL_API_BASE}/system-metrics`, { signal: pingCtrl.signal });
        clearTimeout(pingTimer);
        if (!pingRes.ok) throw new Error("Offline");
        hwFailCountRef.current = 0;
        setApiConnected(true);
      } catch (_) {
        setApiConnected(false);
        setQueue(prev => prev.map(f => (
          f.status !== "done"
            ? { ...f, status: "error", subText: "Không thể xử lý: FastAPI Backend chưa kết nối!" }
            : f
        )));
        return;
      }
    }

    let itemsToRun = queue.filter(f => f.status !== "done");
    if (itemsToRun.length === 0) {
      setQueue(prev => prev.map(f => ({ ...f, status: "waiting", subText: "Đang chờ luồng trống...", processedUrl: null, pipelineText: currentPipelineLabel })));
      itemsToRun = queue.map(f => ({ ...f, status: "waiting", pipelineText: currentPipelineLabel }));
    }
    cancelRef.current = false;
    setIsRunning(true);

    // Register batch job configuration in SQLite before running workers
    try {
      const dbIds = itemsToRun.map(i => i.dbId).filter(Boolean);
      await fetch(`${LOCAL_API_BASE}/api/batch/create-job`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          export_dir: exportPath,
          worker_threads: workerThreads,
          preset_config: { preset, ...pipeline },
          item_ids: dbIds.length > 0 ? dbIds : null,
        }),
      });
    } catch (_) { }

    const startBatchTime = performance.now();
    let completedInBatch = 0;
    const concurrency = Math.max(1, Math.min(workerThreads, 16));
    const pool = [...itemsToRun];
    const worker = async () => {
      while (pool.length > 0 && !cancelRef.current) {
        const item = pool.shift();
        if (!item) break;
        await processSingleItem(item);
        completedInBatch++;
        const elapsed = (performance.now() - startBatchTime) / 1000;
        if (elapsed > 0.05) {
          const fps = completedInBatch / elapsed;
          setSpeedFps(parseFloat(fps.toFixed(1)));
          setEstTimeLeft(fps > 0 ? parseFloat((pool.length / fps).toFixed(1)) : 1.2);
        }
      }
    };
    await Promise.all(Array.from({ length: concurrency }, () => worker()));
    setIsRunning(false);

    // Auto-open destination folder upon completion when enabled
    if (autoOpenFolder && !cancelRef.current && itemsToRun.some(i => !i.isDemo)) {
      handleOpenExportFolder(exportPath);
    }
  };

  const handleDownloadItem = (item, e) => {
    if (e) e.stopPropagation();
    const url = item.processedUrl || item.previewUrl;
    if (!url) return;
    const fileName = `DTF_PRO_${item.name}`;
    const a = document.createElement("a");
    a.href = url; a.download = fileName;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    triggerDownloadToast({ fileName, title: "Đã tải ảnh thành phẩm!", message: `${item.dimensions || "300 DPI"} • ${currentPipelineLabel}`, tag: "PNG 300 DPI" });
  };

  const currentBg = BG_OPTIONS.find(b => b.id === inspectorBg);
  const inspectorBgStyle = currentBg?.id === "checker"
    ? { background: "repeating-conic-gradient(#3a3a4a 0% 25%, #2a2a38 0% 50%) 0 0 / 16px 16px" }
    : { background: currentBg?.style };

  const inspectorSrc = !selectedItem ? null
    : isComparing ? selectedItem.previewUrl
      : xrayMode ? (xrayCanvasUrl || selectedItem.processedUrl || selectedItem.previewUrl)
        : (selectedItem.processedUrl || selectedItem.previewUrl);

  const getRealSizeCm = (item) => {
    if (!item || !item.width || !item.height) return null;
    const dpiUsed = pipeline.dpi || 300;
    const long = Math.max(item.width, item.height);
    const short = Math.min(item.width, item.height);
    const longCm = (long / dpiUsed * 2.54).toFixed(1);
    const shortCm = (short / dpiUsed * 2.54).toFixed(1);
    return item.width >= item.height ? `${longCm} × ${shortCm} cm` : `${shortCm} × ${longCm} cm`;
  };

  return (
    <div className="batch-page">
      <input type="file" ref={fileInputRef} style={{ display: "none" }} multiple accept="image/png,image/jpeg,image/webp,image/bmp,image/tiff" onChange={handleFilesAdded} />
      <input type="file" ref={folderInputRef} style={{ display: "none" }} webkitdirectory="" directory="" multiple onChange={handleFilesAdded} />

      {/* THANH CÔNG CỤ TRÊN CÙNG (TOP BAR) */}
      <div className="batch-top-bar">
        <div className="batch-bar-left">
          <button id="btn-add-folder" className="batch-btn-action" onClick={() => folderInputRef.current?.click()} title="Nạp toàn bộ ảnh trong một thư mục">
            <FolderPlus size={15} className="batch-btn-icon folder-icon" /><span>Thêm Folder ảnh</span>
          </button>
          <button id="btn-add-files" className="batch-btn-action" onClick={() => fileInputRef.current?.click()} title="Chọn nhiều file ảnh từ máy tính">
            <FilePlus size={15} className="batch-btn-icon file-icon" /><span>Thêm từng file</span>
          </button>

          {/* Dropdown Chế độ xử lý */}
          <div className="batch-preset-select-wrap">
            <span className="batch-preset-label">Chế độ xử lý:</span>
            <select
              id="select-preset"
              className="batch-preset-select"
              value={preset}
              onChange={(e) => handlePresetChange(e.target.value)}
            >
              {PRESET_OPTIONS.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Nút bấm xổ xuống Popover Cấu hình Pipeline (6 bước) */}
          <div className="batch-pipeline-popover-wrap" ref={pipelinePopoverRef}>
            <button
              id="btn-pipeline-popover"
              type="button"
              className={`batch-pipeline-trigger-btn ${isPipelineOpen ? "open" : ""}`}
              onClick={() => setIsPipelineOpen(prev => !prev)}
              title="Mở bảng cấu hình chi tiết 6 bước Pipeline"
            >
              <Sliders size={14} color="#818cf8" />
              <span>Cấu hình Pipeline</span>
              <span className="batch-step-count-badge">{activeStepCount}/6</span>
              <ChevronDown size={14} className="batch-chevron-icon" />
            </button>

            {isPipelineOpen && (
              <div className="batch-pipeline-popover">
                <div className="batch-popover-header">
                  <div className="batch-popover-title">
                    <Sliders size={13} color="#818cf8" />
                    <span>Cấu hình Pipeline (6 Bước)</span>
                  </div>
                  <button
                    type="button"
                    className="batch-popover-reset-btn"
                    onClick={handleResetPipelineToPreset}
                    title="Khôi phục thông số mặc định theo Chế độ xử lý hiện tại"
                  >
                    <RotateCcw size={11} style={{ marginRight: 4, verticalAlign: "middle" }} />
                    Mặc định
                  </button>
                </div>

                <div className="batch-pipeline-steps" style={{ padding: "8px 10px", maxHeight: "62vh" }}>
                  {PIPELINE_STEP_DEFS.map(step => (
                    <div key={step.key} className={`batch-step-row ${!pipeline[step.key] && !step.alwaysShowControls ? "disabled" : ""}`}>
                      <div className="batch-step-header">
                        <button type="button" className="batch-toggle-btn" onClick={() => toggleStep(step.key)}>
                          {pipeline[step.key] ? <ToggleRight size={20} color="#10b981" /> : <ToggleLeft size={20} color="#6b7280" />}
                        </button>
                        <span className="batch-step-num">{step.num}</span>
                        <span className="batch-step-name">{step.name}</span>
                      </div>
                      {(pipeline[step.key] || step.alwaysShowControls) && step.controls.length > 0 && (
                        <div className="batch-step-control">
                          {step.controls.map(ctrl => {
                            if (ctrl.showIf && !pipeline[ctrl.showIf]) return null;
                            return (
                              <div key={ctrl.field} className="batch-step-input-row">
                                <label>{ctrl.label}</label>
                                {ctrl.type === "range" && (
                                  <>
                                    <input
                                      type="range"
                                      min={ctrl.min}
                                      max={ctrl.max}
                                      step={ctrl.step}
                                      value={pipeline[ctrl.field]}
                                      onChange={e => setStepVal(ctrl.field, +e.target.value)}
                                      className="batch-slider"
                                    />
                                    <span className="batch-val-badge">{pipeline[ctrl.field]}{ctrl.unit ? ` ${ctrl.unit}` : ""}</span>
                                  </>
                                )}
                                {ctrl.type === "number" && (
                                  <>
                                    <input
                                      type="number"
                                      min={ctrl.min}
                                      max={ctrl.max}
                                      step={ctrl.step}
                                      value={pipeline[ctrl.field]}
                                      onChange={e => setStepVal(ctrl.field, +e.target.value)}
                                      className="batch-num-input"
                                    />
                                    <span className="batch-val-badge">{ctrl.unit}</span>
                                  </>
                                )}
                                {ctrl.type === "checkbox" && (
                                  <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: "0.72rem", color: "var(--text-primary)" }}>
                                    <input
                                      type="checkbox"
                                      checked={Boolean(pipeline[ctrl.field])}
                                      onChange={e => setStepVal(ctrl.field, e.target.checked)}
                                    />
                                    <span>{pipeline[ctrl.field] ? "Bật (Flood Fill 4 góc)" : "Tắt"}</span>
                                  </label>
                                )}
                                {ctrl.type === "select" && (
                                  <select
                                    className="batch-dpi-select"
                                    value={pipeline[ctrl.field]}
                                    onChange={e => setStepVal(ctrl.field, +e.target.value)}
                                  >
                                    {ctrl.options.map(o => <option key={o} value={o}>{o} DPI</option>)}
                                  </select>
                                )}
                                {ctrl.type === "select_custom" && (
                                  <select
                                    className="batch-dpi-select"
                                    value={pipeline[ctrl.field]}
                                    onChange={e => setStepVal(ctrl.field, +e.target.value)}
                                  >
                                    {ctrl.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                  </select>
                                )}
                                {ctrl.type === "select_str" && (
                                  <select
                                    className="batch-dpi-select"
                                    value={pipeline[ctrl.field] || "RGBA"}
                                    onChange={e => setStepVal(ctrl.field, e.target.value)}
                                  >
                                    {ctrl.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                  </select>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Segmented Control chọn Hệ màu nhanh: [ RGBA | CMYK ] đồng bộ 2 chiều với Bước 6 */}
          <div className="batch-colormode-segmented" title="Chuyển đổi hệ màu đích cho in ấn DTF (RGBA 32-bit hoặc CMYK Gamut-Matched)">
            <button
              type="button"
              className={`batch-colormode-btn ${(pipeline.colorMode || "RGBA") === "RGBA" ? "active" : ""}`}
              onClick={() => setStepVal("colorMode", "RGBA")}
            >
              RGBA
            </button>
            <button
              type="button"
              className={`batch-colormode-btn ${String(pipeline.colorMode || "").startsWith("CMYK") ? "active" : ""}`}
              onClick={() => setStepVal("colorMode", "CMYK")}
            >
              CMYK
            </button>
          </div>

          <button id="btn-clear-queue" className="batch-btn-action batch-btn-danger" onClick={handleClearQueue} disabled={isRunning || totalFiles === 0} title="Xóa danh sách hàng đợi">
            <Trash2 size={14} /><span>Xoá hàng đợi</span>
          </button>
          {totalFiles === 0 && (
            <button id="btn-load-samples" className="batch-btn-action" onClick={handleLoadSampleData} title="Nạp 6 file ảnh mẫu để kiểm thử nhanh">
              <Layers size={14} color="#818cf8" /><span>Nạp mẫu</span>
            </button>
          )}
        </div>

        <div className="batch-bar-right">
          <div className="batch-status-ready">
            <div className={`batch-ready-indicator ${apiConnected ? "" : "offline"}`}>
              <span className={`batch-ready-dot ${apiConnected ? "" : "offline"}`} />
              <span>
                {apiConnected
                  ? (hwMetrics.cuda_ready ? "DirectX / TensorRT Sẵn sàng" : "CPU Fallback Sẵn sàng")
                  : "FastAPI Không kết nối"}
              </span>
            </div>
            <div className="batch-dest-text" style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <FolderOpen size={11} color="#93c5fd" style={{ flexShrink: 0 }} />
              <span>Đích:</span>
              <span className="batch-dest-path" title="Nhấn để đổi thư mục xuất" style={{ cursor: "pointer" }} onClick={handlePickExportFolder}>{exportPath}</span>
            </div>
          </div>
          <button id="btn-batch-process-action" className={`batch-btn-start ${isRunning ? "running" : ""}`} onClick={toggleBatchProcess} disabled={!isRunning && totalFiles === 0}>
            {isRunning ? <><Square size={14} fill="currentColor" />DỪNG LẠI ({waitingFiles} FILE)</> : <><Play size={14} fill="currentColor" />BẮT ĐẦU XỬ LÝ ({totalFiles} FILE)<span className="batch-key-badge">F5</span></>}
          </button>
        </div>
      </div>

      {/* LƯỚI THÔNG SỐ PHẦN CỨNG */}
      <div className="batch-metrics-grid">
        <div className="batch-metric-box batch-progress-box">
          <div className="batch-card-accent progress-accent" />
          <div>
            <div className="batch-progress-header">
              <span className="batch-progress-title"><span className="batch-progress-dot" />Tiến độ Render Hàng loạt</span>
              <span className="batch-progress-pct">{progressPercent}%</span>
            </div>
            <div className="batch-progress-track"><div className="batch-progress-fill" style={{ width: `${progressPercent}%` }} /></div>
            <div className="batch-progress-sub-info">
              <span className="batch-completed-count"><strong className="batch-completed-num">{doneFiles}</strong><span className="batch-slash">/</span> {totalFiles} file hoàn tất</span>
              <span className="batch-queue-badge">{waitingFiles} tệp đang chờ</span>
            </div>
          </div>
          <div className="batch-speed-row">
            <div className="batch-speed-item"><Clock size={12} className="batch-speed-icon time" /><span className="batch-speed-lbl">ước tính còn lại:</span><span className="batch-speed-val time">~{estTimeLeft} giây</span></div>
            <div className="batch-speed-item"><Zap size={12} className="batch-speed-icon cuda" /><span className="batch-speed-lbl">Tốc độ CUDA:</span><span className="batch-speed-val cuda">{speedFps} file/s</span></div>
          </div>
        </div>
        <div className="batch-metric-box"><div className="batch-card-accent gpu-accent" /><div className="batch-hw-header"><span>GPU CUDA</span><Activity size={13} color="#818cf8" /></div><div className="batch-hw-value">{hwMetrics.gpu_percent}%</div><div className="batch-hw-bar"><div className="batch-hw-bar-fill" style={{ width: `${hwMetrics.gpu_percent}%`, background: "linear-gradient(90deg, #6366f1, #818cf8)" }} /></div><div className="batch-hw-sub" title={hwMetrics.gpu_name}>{hwMetrics.gpu_name}</div></div>
        <div className="batch-metric-box"><div className="batch-card-accent cpu-accent" /><div className="batch-hw-header"><span>CPU CORES</span><Cpu size={13} color="#a855f7" /></div><div className="batch-hw-value">{hwMetrics.cpu_percent}%</div><div className="batch-hw-bar"><div className="batch-hw-bar-fill" style={{ width: `${hwMetrics.cpu_percent}%`, background: "linear-gradient(90deg, #8b5cf6, #c084fc)" }} /></div><div className="batch-hw-sub">{hwMetrics.cpu_cores} Lõi / {hwMetrics.cpu_threads} Luồng</div></div>
        <div className="batch-metric-box"><div className="batch-card-accent vram-accent" /><div className="batch-hw-header"><span>VRAM POOL</span><HardDrive size={13} color="#06b6d4" /></div><div className="batch-hw-value">{hwMetrics.vram_used_gb} GB</div><div className="batch-hw-bar"><div className="batch-hw-bar-fill" style={{ width: `${Math.min(100, (hwMetrics.vram_used_gb / hwMetrics.vram_total_gb) * 100)}%`, background: "linear-gradient(90deg, #0ea5e9, #38bdf8)" }} /></div><div className="batch-hw-sub">{hwMetrics.vram_total_gb} GB Bộ nhớ riêng</div></div>
        <div className="batch-metric-box">
          <div className="batch-card-accent error-accent" style={!apiConnected ? { background: "linear-gradient(90deg, #ef4444 0%, #f87171 100%)" } : undefined} />
          <div className="batch-hw-header">
            <span>LỖI ENGINE</span>
            {apiConnected ? <ShieldCheck size={13} color="#10b981" /> : <AlertTriangle size={13} color="#ef4444" />}
          </div>
          <div className="batch-hw-value" style={{ color: apiConnected ? "#34d399" : "#ef4444" }}>{hwMetrics.engine_errors}</div>
          <div className="batch-hw-bar">
            <div className="batch-hw-bar-fill" style={{ width: "100%", background: apiConnected ? "#10b981" : "#ef4444" }} />
          </div>
          <div className="batch-hw-sub" style={{ color: apiConnected ? "#34d399" : "#ef4444", fontWeight: 600 }}>
            {apiConnected ? hwMetrics.engine_status : "FastAPI Không kết nối"}
          </div>
        </div>
      </div>

      {/* WORKSPACE 2 CỘT: DANH SÁCH HÀNG ĐỢI (~68%) + TRẠM KIỂM ĐỊNH (~32%) */}
      <div className="batch-workspace-2col">

        {/* CỘT TRÁI (MỞ RỘNG ~68%): BẢNG HÀNG ĐỢI */}
        <div className="batch-queue-card">
          <div className="batch-queue-top">
            <div className="batch-queue-title-wrap">
              <span className="batch-queue-title">Danh sách hàng đợi</span>
              <span className="batch-queue-tag">{totalFiles} file trong hàng đợi</span>
            </div>
            <div className="batch-queue-mini-progress">
              <div className="batch-queue-mini-bar"><div className="batch-queue-mini-fill" style={{ width: `${progressPercent}%` }} /></div>
            </div>
            <div className="batch-filter-tabs">
              {[
                { key: "all", label: `Tất cả (${totalFiles})` },
                { key: "done", label: `Xong (${doneFiles})` },
                { key: "processing", label: `Đang chạy (${processingFiles})` },
                { key: "waiting", label: `Chờ (${waitingFiles})` },
                ...(errorFiles > 0 ? [{ key: "error", label: `Lỗi (${errorFiles})` }] : []),
              ].map(tab => (
                <button key={tab.key} className={`batch-tab-btn ${activeTab === tab.key ? "active" : ""}`} onClick={() => setActiveTab(tab.key)}>{tab.label}</button>
              ))}
            </div>
          </div>
          <div className="batch-table-wrap">
            <table className="batch-table">
              <thead><tr>
                <th style={{ width: "29%" }}>TỆP & BẢN XEM</th>
                <th style={{ width: "16%" }}>ĐỘ PHÂN GIẢI</th>
                <th style={{ width: "11%" }}>DUNG LƯỢNG</th>
                <th style={{ width: "18%" }}>PIPELINE ƯU TIÊN</th>
                <th style={{ width: "16%" }}>TRẠNG THÁI</th>
                <th style={{ width: "10%", textAlign: "center" }}>THAO TÁC</th>
              </tr></thead>
              <tbody>
                {filteredQueue.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "48px 16px" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                        <Layers size={28} color="#6366f1" style={{ opacity: 0.7 }} />
                        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>
                          {totalFiles === 0 ? "Hàng đợi đang trống" : "Không có tệp nào trong bộ lọc này"}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", maxWidth: 360 }}>
                          {totalFiles === 0
                            ? "Hãy bấm \"Thêm Folder ảnh\" hoặc \"Thêm từng file\" để nạp ảnh thực tế cần xử lý in DTF."
                            : "Chuyển sang tab \"Tất cả\" để xem toàn bộ danh sách."}
                        </div>
                        {totalFiles === 0 && (
                          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                            <button type="button" className="batch-btn-action" onClick={() => fileInputRef.current?.click()}>
                              <FilePlus size={14} className="batch-btn-icon file-icon" /><span>Thêm từng file</span>
                            </button>
                            <button type="button" className="batch-btn-action" onClick={handleLoadSampleData}>
                              <Layers size={14} color="#818cf8" /><span>Nạp dữ liệu mẫu (Test)</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : filteredQueue.map(item => {
                  const isSel = item.id === selectedId;
                  // Đồng bộ 100% cột PIPELINE ƯU TIÊN với Chế độ xử lý đang chọn
                  const displayedPipeline = (item.status === "waiting" || !item.pipelineText || item.pipelineText.includes("Watermark"))
                    ? currentPipelineLabel
                    : item.pipelineText;
                  return (
                    <tr key={item.id} className={`batch-row ${isSel ? "selected" : ""}`} onClick={() => setSelectedId(item.id)}>
                      <td><div className="batch-file-cell">
                        <div className="batch-thumb-wrap"><img src={item.processedUrl || item.previewUrl} alt={item.name} className="batch-thumb-img" /></div>
                        <div className="batch-file-meta">
                          <div className="batch-file-name" title={item.name}>{item.name}</div>
                          <div className={`batch-file-sub ${item.status}`}>{item.status === "processing" && <RefreshCw size={9} className="spin-fast" />}{item.subText}</div>
                        </div>
                      </div></td>
                      <td><div className="batch-res-cell"><span className="batch-res-dim">{item.dimensions}</span><span className="batch-res-dpi">{item.dpiText}</span></div></td>
                      <td><span className="batch-size-cell">{item.sizeText}</span></td>
                      <td><span className="batch-pipeline-badge" title={displayedPipeline}>{displayedPipeline}</span></td>
                      <td>
                        {item.status === "done" && <span className="batch-status-pill done"><CheckCircle2 size={11} />Hoàn tất</span>}
                        {item.status === "processing" && <span className="batch-status-pill processing"><RefreshCw size={11} className="spin-fast" />Đang xử lý</span>}
                        {item.status === "waiting" && <span className="batch-status-pill waiting"><Clock size={11} />Chờ xử lý</span>}
                        {item.status === "error" && <span className="batch-status-pill error"><XCircle size={11} />Lỗi</span>}
                      </td>
                      <td style={{ textAlign: "center" }}><div className="batch-action-btns">
                        {item.status === "done"
                          ? <button className="batch-icon-btn" title="Tải về tệp thành phẩm" onClick={e => handleDownloadItem(item, e)}><Download size={13} color="#10b981" /></button>
                          : <button className="batch-icon-btn remove" title="Xoà tệp khỏi hàng đợi" onClick={e => handleRemoveItem(item.id, e)}><X size={13} /></button>}
                      </div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* CỘT PHẢI (~32%): TRẠM KIỂM ĐỊNH (INSPECTOR) */}
        <div className="batch-inspector-card">
          <div className="batch-inspector-top">
            <div className="batch-inspector-title"><Eye size={14} color="#818cf8" />Trạm Kiểm định (Inspector)</div>
            <button className="batch-inspector-zoom-btn" onClick={() => setIsZoomed(!isZoomed)}>
              {isZoomed ? <><ZoomOut size={11} /><span>Vừa khung</span></> : <><ZoomIn size={11} /><span>Zoom 100%</span></>}
            </button>
          </div>
          <div className="batch-inspector-bg-switcher">
            <span className="batch-inspector-bg-label">Nền:</span>
            {BG_OPTIONS.map(bg => (
              <button key={bg.id} className={`batch-bg-btn ${inspectorBg === bg.id ? "active" : ""}`} onClick={() => setInspectorBg(bg.id)}>
                <span className="batch-bg-swatch" style={bg.id === "checker" ? { background: "repeating-conic-gradient(#666 0% 25%, #999 0% 50%) 0 0 / 8px 8px" } : { background: bg.style || "#000" }} />
                {bg.label}
              </button>
            ))}
            <button className={`batch-xray-btn ${xrayMode ? "active" : ""}`} onClick={() => setXrayMode(p => !p)} title="Soi bụi Alpha — Phím M">
              <Scan size={12} />{xrayMode ? "X-Ray Bật" : "Soi Bụi Alpha"}<kbd className="batch-key-hint">M</kbd>
            </button>
          </div>
          <div className="batch-preview-viewport" style={{ ...inspectorBgStyle, flex: "0 0 350px" }}>
            {selectedItem ? (
              <>
                <img
                  src={inspectorSrc || selectedItem.previewUrl}
                  alt={selectedItem.name}
                  className={`batch-preview-img ${isZoomed ? "zoomed" : ""}`}
                  style={
                    !isComparing && !xrayMode && String(pipeline.colorMode || "").startsWith("CMYK") && !selectedItem.processedUrl
                      ? { filter: "saturate(0.88) contrast(0.96)" }
                      : undefined
                  }
                />
                <div className="batch-alpha-badge"><span className="batch-alpha-dot" />Alpha: {selectedItem.alphaClean}% Sạch</div>
                <div className="batch-dim-badge"><Layers size={11} color="#818cf8" />{selectedItem.dimensions} • {pipeline.colorMode || "RGBA"}</div>
                {isComparing && <div className="batch-compare-overlay"><span>Ảnh Gốc (Original)</span><span className="batch-compare-hint">Giữ [Space]</span></div>}
                {xrayMode && <div className="batch-xray-overlay"><Crosshair size={10} />X-RAY — Đỏ = Pixel bán trong suốt</div>}
              </>
            ) : (
              <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <ImageIcon size={22} style={{ opacity: 0.45 }} />
                <span>Chưa chọn file nào</span>
              </div>
            )}
          </div>

          <div className="batch-inspector-details">
            {selectedItem ? (
              <>
                <div className="batch-prop-row"><span className="batch-prop-lbl">File:</span><span className="batch-prop-val"><strong>{selectedItem.name}</strong></span></div>
                <div className="batch-prop-row"><span className="batch-prop-lbl">Kích thước (px):</span><span className="batch-prop-val highlight-blue">{selectedItem.dimensions}</span></div>
                <div className="batch-prop-row"><span className="batch-prop-lbl">Kích thước thực:</span><span className="batch-prop-val highlight-blue">{getRealSizeCm(selectedItem) || "—"}</span></div>
                <div className="batch-prop-row"><span className="batch-prop-lbl">Mật độ:</span><span className="batch-prop-val highlight-blue">{pipeline.dpi || 300} DPI</span></div>
                <div className="batch-prop-row"><span className="batch-prop-lbl">Hệ màu đích:</span><span className="batch-prop-val highlight-purple">{getTargetColorModeDescription(pipeline.colorMode)}</span></div>
                <div className="batch-prop-row"><span className="batch-prop-lbl">Chế độ ưu tiên:</span><span className="batch-prop-val highlight-purple" title={currentPipelineLabel}>{currentPipelineLabel}</span></div>
                <div className="batch-prop-row"><span className="batch-prop-lbl">Dạng Alpha:</span><span className="batch-prop-val highlight-purple">{selectedItem.alphaClean}% sạch</span></div>
                {selectedItem.sizeText && <div className="batch-prop-row"><span className="batch-prop-lbl">Dung lượng:</span><span className="batch-prop-val">{selectedItem.sizeText}</span></div>}
                {selectedItem.removedDust > 0 && <div className="batch-prop-row"><span className="batch-prop-lbl">Cụm bụi đã xóa:</span><span className="batch-prop-val highlight-purple">{selectedItem.removedDust} cụm</span></div>}
                {selectedItem.renderTime && <div className="batch-prop-row"><span className="batch-prop-lbl">Thời gian render:</span><span className="batch-prop-val">{selectedItem.renderTime.toFixed(2)}s</span></div>}
                <div className="batch-dest-export-card">
                  <span className="batch-dest-export-lbl">Thư mục xuất:</span>
                  <div className="batch-dest-export-box">
                    <div style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden", cursor: "pointer" }} onClick={() => handleOpenExportFolder(exportPath)} title="Nhấn để mở thư mục xuất">
                      <FolderOpen size={13} color="#93c5fd" style={{ flexShrink: 0 }} />
                      <span className="batch-dest-export-path">{exportPath}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <button className="batch-icon-btn" title="Đổi thư mục xuất" onClick={handlePickExportFolder} style={{ fontSize: "0.65rem", padding: "2px 6px", gap: 3 }}><RefreshCw size={10} /><span>Đổi</span></button>
                      <button className="batch-icon-btn" title="Mở thư mục xuất" onClick={() => handleOpenExportFolder(exportPath)}><FolderOpen size={11} /></button>
                      <button className="batch-icon-btn" title="Sao chép đường dẫn" onClick={() => navigator.clipboard?.writeText(exportPath)}><Copy size={11} /></button>
                    </div>
                  </div>
                </div>
                <div className="batch-inspector-actions">
                  <button className="batch-btn-download-inspector" onClick={() => handleDownloadItem(selectedItem)}>
                    <Download size={14} /><span>Tải tệp này ({pipeline.colorMode === "CMYK_TIFF" ? "TIFF" : "PNG"} {pipeline.dpi || 300} DPI • {pipeline.colorMode === "CMYK_TIFF" ? "CMYK" : (pipeline.colorMode || "RGBA")})</span>
                  </button>
                </div>
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", textAlign: "center", padding: "12px 6px" }}>
                  Chọn một tệp trong bảng hàng đợi để soi chi tiết kênh Alpha và thông số in DTF.
                </div>
                <div className="batch-dest-export-card">
                  <span className="batch-dest-export-lbl">Thư mục xuất:</span>
                  <div className="batch-dest-export-box">
                    <div style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden", cursor: "pointer" }} onClick={() => handleOpenExportFolder(exportPath)} title="Nhấn để mở thư mục xuất">
                      <FolderOpen size={13} color="#93c5fd" style={{ flexShrink: 0 }} />
                      <span className="batch-dest-export-path">{exportPath}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <button className="batch-icon-btn" title="Đổi thư mục xuất" onClick={handlePickExportFolder} style={{ fontSize: "0.65rem", padding: "2px 6px", gap: 3 }}><RefreshCw size={10} /><span>Đổi</span></button>
                      <button className="batch-icon-btn" title="Mở thư mục xuất" onClick={() => handleOpenExportFolder(exportPath)}><FolderOpen size={11} /></button>
                      <button className="batch-icon-btn" title="Sao chép đường dẫn" onClick={() => navigator.clipboard?.writeText(exportPath)}><Copy size={11} /></button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* FOOTER CỐ ĐỊNH Ở ĐÁY TRẠM KIỂM ĐỊNH: LUỒNG XỬ LÝ & TỰ MỞ THƯ MỤC */}
          <div className="batch-inspector-footer">
            <div className="batch-worker-setting" style={{ padding: 0 }}>
              <Cpu size={12} color="#818cf8" style={{ flexShrink: 0 }} />
              <span>Luồng xử lý:</span>
              <select
                className="batch-worker-select"
                value={workerThreads}
                onChange={e => setWorkerThreads(Number(e.target.value))}
                disabled={isRunning}
              >
                {[1, 2, 4, 8].map(n => <option key={n} value={n}>{n} Worker{n > 1 ? "s" : ""}</option>)}
              </select>
            </div>
            <label className="batch-auto-open-wrap" style={{ padding: 0 }}>
              <input
                type="checkbox"
                checked={autoOpenFolder}
                onChange={e => setAutoOpenFolder(e.target.checked)}
              />
              <span>Tự mở thư mục khi hoàn thành</span>
            </label>
          </div>
        </div>
      </div>

      {/* THANH TRẠNG THÁI DƯỚI */}
      <div className="batch-bottom-status-bar">
        <div className="batch-status-chips-left">
          <span
            className="batch-status-chip-item"
            style={{ color: apiConnected ? "#10b981" : "#ef4444", fontWeight: 600 }}
            title={apiConnected ? `Đã kết nối Backend (${LOCAL_API_BASE})` : `Không thể kết nối tới Backend (${LOCAL_API_BASE})`}
          >
            <span className={`batch-ready-dot ${apiConnected ? "" : "offline"}`} style={{ width: 6, height: 6 }} />
            {apiConnected ? "FastAPI Kết nối" : "FastAPI Không kết nối"}
          </span>
        </div>
        <div className="batch-status-hint-right">
          <span className="batch-space-hint">Nhấn <kbd style={{ fontWeight: 700, color: "#fff" }}>Space</kbd> So sánh • <kbd style={{ fontWeight: 700, color: "#fff", marginLeft: 4 }}>M</kbd> X-Ray Bụi Alpha</span>
          <span className="batch-engine-version">rengofun-engine-core: {hwMetrics.backend_version}</span>
        </div>
      </div>
    </div>
  );
}

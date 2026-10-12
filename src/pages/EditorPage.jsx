import { useState, useRef, useEffect, useCallback } from "react";
import "../styles/editor.css";
import { triggerDownloadToast } from "../components/DownloadToast";
import {
  Upload,
  Download,
  Undo2,
  Redo2,
  RotateCcw,
  Crop,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Sun,
  Palette,
  Wand2,
  Sparkles,
  Sliders,
  Eye,
  Maximize2,
  Check,
  X,
  Scissors,
  Layers,
  Activity,
  Contrast,
  Image as ImageIcon,
} from "lucide-react";

// ── Default Adjustments State ─────────────────────────────────────────────────
const DEFAULT_ADJUSTMENTS = {
  // Geometric
  rotation: 0,
  flipH: false,
  flipV: false,
  // Color & Tone
  brightness: 0,
  contrast: 0,
  exposure: 0,
  gamma: 1.0,
  saturation: 0,
  vibrance: 0,
  temperature: 0,
  tint: 0,
  hue: 0,
  // Details & Blur
  sharpen: 0,
  blur: 0,
  denoise: 0,
  // Effects
  grayscale: false,
  sepia: 0,
  vignette: 0,
  invert: false,
  // DTF Special
  hardenAlpha: false,
};

// ── Helper: Tạo SVG demo cho Editor ──────────────────────────────────────────
function createEditorDemoSvg(type = "cyber") {
  const color1 = type === "cyber" ? "#6366f1" : "#f59e0b";
  const color2 = type === "cyber" ? "#ec4899" : "#ef4444";
  const title = type === "cyber" ? "CYBER SKULL" : "RETRO TIGER";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
    <defs>
      <linearGradient id="ed_g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color1}"/>
        <stop offset="100%" stop-color="${color2}"/>
      </linearGradient>
      <filter id="ed_shadow">
        <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="${color1}" flood-opacity="0.5"/>
      </filter>
    </defs>
    <rect width="100%" height="100%" fill="none"/>
    <g filter="url(#ed_shadow)">
      <circle cx="400" cy="380" r="220" fill="url(#ed_g)"/>
      <path d="M300,520 L500,520 L480,620 L320,620 Z" fill="url(#ed_g)"/>
      <circle cx="330" cy="360" r="50" fill="#0d0d14"/>
      <circle cx="470" cy="360" r="50" fill="#0d0d14"/>
      <polygon points="400,430 375,480 425,480" fill="#0d0d14"/>
      <path d="M350,560 L350,600 M400,560 L400,600 M450,560 L450,600" stroke="#0d0d14" stroke-width="12" stroke-linecap="round"/>
      <text x="400" y="720" font-family="sans-serif" font-weight="900" font-size="44" fill="#ffffff" text-anchor="middle" letter-spacing="4">${title}</text>
    </g>
  </svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

export default function EditorPage() {
  // ── Image Source & Canvas State ────────────────────────────────────────────
  const [sourceImage, setSourceImage] = useState(null);
  const [imageMeta, setImageMeta] = useState({ name: "Untitled", width: 0, height: 0, sizeText: "" });
  const [activeTab, setActiveTab] = useState("color"); // 'color' | 'geometry' | 'details' | 'effects' | 'dtf'
  
  // Adjustments & History
  const [adj, setAdj] = useState(DEFAULT_ADJUSTMENTS);
  const [history, setHistory] = useState([DEFAULT_ADJUSTMENTS]);
  const [historyIdx, setHistoryIdx] = useState(0);

  // Resize Inputs
  const [resizeW, setResizeW] = useState(0);
  const [resizeH, setResizeH] = useState(0);
  const [lockAspect, setLockAspect] = useState(true);

  // Crop State
  const [isCropMode, setIsCropMode] = useState(false);
  const [cropAspect, setCropAspect] = useState("free");

  // Viewport State
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [isComparing, setIsComparing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // DOM Refs
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const previewCanvasRef = useRef(null); // hidden original canvas

  // ── 1. Nạp ảnh mới & khởi tạo ──────────────────────────────────────────────
  const handleLoadImageSrc = (src, name = "Sample_DTF.png", size = "2.4 MB") => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setSourceImage(img);
      setImageMeta({
        name,
        width: img.naturalWidth,
        height: img.naturalHeight,
        sizeText: size,
      });
      setResizeW(img.naturalWidth);
      setResizeH(img.naturalHeight);
      setAdj(DEFAULT_ADJUSTMENTS);
      setHistory([DEFAULT_ADJUSTMENTS]);
      setHistoryIdx(0);
      setIsCropMode(false);
    };
    img.src = src;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + " MB";
    handleLoadImageSrc(url, file.name, sizeStr);
    e.target.value = "";
  };

  // Khởi tạo một mẫu ảnh demo khi vừa mở
  useEffect(() => {
    handleLoadImageSrc(createEditorDemoSvg("cyber"), "Skull_Cyber_Print_01.png", "18.4 MB");
  }, []);

  // ── 2. History: Undo / Redo ────────────────────────────────────────────────
  const pushHistory = (newAdj) => {
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIdx + 1);
      return [...sliced, newAdj];
    });
    setHistoryIdx((prev) => prev + 1);
  };

  const handleUndo = () => {
    if (historyIdx > 0) {
      const prevIdx = historyIdx - 1;
      setHistoryIdx(prevIdx);
      setAdj(history[prevIdx]);
    }
  };

  const handleRedo = () => {
    if (historyIdx < history.length - 1) {
      const nextIdx = historyIdx + 1;
      setHistoryIdx(nextIdx);
      setAdj(history[nextIdx]);
    }
  };

  const handleResetAll = () => {
    setAdj(DEFAULT_ADJUSTMENTS);
    pushHistory(DEFAULT_ADJUSTMENTS);
  };

  const updateAdj = (key, val) => {
    setAdj((prev) => {
      const next = { ...prev, [key]: val };
      return next;
    });
  };

  // Ghi nhận snapshot history khi thả chuột ra khỏi slider
  const handleSliderCommit = () => {
    pushHistory(adj);
  };

  // ── 3. Render Canvas Thuật Toán Thực Tế (Live Canvas Processing) ───────────
  const renderCanvas = useCallback(() => {
    if (!sourceImage || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const origW = sourceImage.naturalWidth;
    const origH = sourceImage.naturalHeight;

    // Tính toán góc xoay & lật
    const rad = (adj.rotation * Math.PI) / 180;
    const isSideways = Math.abs(adj.rotation % 180) === 90;
    const canvasW = isSideways ? origH : origW;
    const canvasH = isSideways ? origW : origH;

    canvas.width = canvasW;
    canvas.height = canvasH;

    ctx.save();
    ctx.clearRect(0, 0, canvasW, canvasH);

    // Di chuyển tâm và áp dụng biến đổi hình học
    ctx.translate(canvasW / 2, canvasH / 2);
    ctx.rotate(rad);
    ctx.scale(adj.flipH ? -1 : 1, adj.flipV ? -1 : 1);
    ctx.drawImage(sourceImage, -origW / 2, -origH / 2);
    ctx.restore();

    // Nếu người dùng đang giữ Space để so sánh ảnh gốc -> Dừng tại đây
    if (isComparing) return;

    // ── Xử lý điểm ảnh Pixel Manipulation (Color, Tone, Filters) ────────────
    const imgData = ctx.getImageData(0, 0, canvasW, canvasH);
    const data = imgData.data;
    const len = data.length;

    // Các hệ số tiền tính toán
    const alphaContrast = (adj.contrast + 100) / 100;
    const betaBrightness = adj.brightness * 1.28;
    const expMult = adj.exposure !== 0 ? Math.pow(2, adj.exposure) : 1;
    const gammaInv = adj.gamma !== 1.0 ? 1 / adj.gamma : 1;
    const tempOffset = adj.temperature * 0.6;
    const tintOffset = adj.tint * 0.5;
    const satMult = (adj.saturation + 100) / 100;
    const vibMult = adj.vibrance / 100;

    for (let i = 0; i < len; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      let a = data[i + 3];

      if (a === 0) continue; // Bỏ qua vùng hoàn toàn trong suốt

      // 1. Exposure (Phơi sáng)
      if (expMult !== 1) {
        r *= expMult;
        g *= expMult;
        b *= expMult;
      }

      // 2. Brightness & Contrast (Độ sáng & Độ tương phản)
      if (adj.contrast !== 0 || adj.brightness !== 0) {
        r = (r - 128) * alphaContrast + 128 + betaBrightness;
        g = (g - 128) * alphaContrast + 128 + betaBrightness;
        b = (b - 128) * alphaContrast + 128 + betaBrightness;
      }

      // 3. Gamma Correction
      if (gammaInv !== 1) {
        r = 255 * Math.pow(Math.max(0, r) / 255, gammaInv);
        g = 255 * Math.pow(Math.max(0, g) / 255, gammaInv);
        b = 255 * Math.pow(Math.max(0, b) / 255, gammaInv);
      }

      // 4. Cân bằng trắng (Temperature & Tint)
      if (adj.temperature !== 0) {
        r += tempOffset;
        b -= tempOffset;
      }
      if (adj.tint !== 0) {
        g += tintOffset;
        r += tintOffset * 0.2;
        b += tintOffset * 0.2;
      }

      // 5. Saturation & Vibrance (Độ bão hòa & Rực màu thông minh)
      if (adj.saturation !== 0 || adj.vibrance !== 0) {
        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        const l = (maxC + minC) / 2;
        const d = maxC - minC;
        if (d > 0) {
          const s = l > 128 ? d / (510 - maxC - minC) : d / (maxC + minC);
          const factor = satMult * (1 + vibMult * (1 - s));
          r = l + (r - l) * factor;
          g = l + (g - l) * factor;
          b = l + (b - l) * factor;
        }
      }

      // 6. Grayscale (ITU-R BT.709)
      if (adj.grayscale) {
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        r = lum;
        g = lum;
        b = lum;
      }

      // 7. Sepia (Tone cổ điển)
      if (adj.sepia > 0) {
        const factor = adj.sepia / 100;
        const sr = 0.393 * r + 0.769 * g + 0.189 * b;
        const sg = 0.349 * r + 0.686 * g + 0.168 * b;
        const sb = 0.272 * r + 0.534 * g + 0.131 * b;
        r = r + (sr - r) * factor;
        g = g + (sg - g) * factor;
        b = b + (sb - b) * factor;
      }

      // 8. Đảo màu (Invert)
      if (adj.invert) {
        r = 255 - r;
        g = 255 - g;
        b = 255 - b;
      }

      // 9. DTF Harden Semi-Alpha (Làm cứng viền bán trong suốt)
      if (adj.hardenAlpha && a > 12) {
        a = 255;
      }

      // Giới hạn giá trị [0, 255]
      data[i] = Math.min(255, Math.max(0, r));
      data[i + 1] = Math.min(255, Math.max(0, g));
      data[i + 2] = Math.min(255, Math.max(0, b));
      data[i + 3] = a;
    }

    // Áp dụng Vignette (Viền tối)
    if (adj.vignette > 0) {
      const cx = canvasW / 2;
      const cy = canvasH / 2;
      const maxDist = Math.sqrt(cx * cx + cy * cy);
      const strength = adj.vignette / 100;

      for (let y = 0; y < canvasH; y++) {
        for (let x = 0; x < canvasW; x++) {
          const idx = (y * canvasW + x) * 4;
          const dist = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
          const factor = Math.min(1, dist / maxDist);
          const falloff = 1 - strength * factor * factor;
          data[idx] *= falloff;
          data[idx + 1] *= falloff;
          data[idx + 2] *= falloff;
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);

    // Áp dụng Blur (Làm mờ)
    if (adj.blur > 0) {
      ctx.save();
      ctx.filter = `blur(${adj.blur}px)`;
      ctx.drawImage(canvas, 0, 0);
      ctx.restore();
    }
  }, [sourceImage, adj, isComparing]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Phím tắt Space để so sánh Before/After
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code === "Space" && !e.repeat && e.target.tagName !== "INPUT") {
        e.preventDefault();
        setIsComparing(true);
      }
    };
    const onKeyUp = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsComparing(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // ── 4. Xoay & Lật nhanh ───────────────────────────────────────────────────
  const handleRotate90 = (dir) => {
    const nextRot = (adj.rotation + (dir === "left" ? -90 : 90)) % 360;
    const nextAdj = { ...adj, rotation: nextRot };
    setAdj(nextAdj);
    pushHistory(nextAdj);
  };

  const handleFlip = (axis) => {
    const nextAdj = axis === "h" ? { ...adj, flipH: !adj.flipH } : { ...adj, flipV: !adj.flipV };
    setAdj(nextAdj);
    pushHistory(nextAdj);
  };

  // ── 5. Cắt ảnh (Crop Tool) ─────────────────────────────────────────────────
  const handleApplyCrop = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    let cropW = canvas.width;
    let cropH = canvas.height;

    if (cropAspect === "1:1") {
      cropW = Math.min(canvas.width, canvas.height);
      cropH = cropW;
    } else if (cropAspect === "4:3") {
      cropW = canvas.width;
      cropH = (cropW * 3) / 4;
    } else if (cropAspect === "16:9") {
      cropW = canvas.width;
      cropH = (cropW * 9) / 16;
    } else if (cropAspect === "3:4") {
      cropH = canvas.height;
      cropW = (cropH * 3) / 4;
    }

    const startX = Math.max(0, (canvas.width - cropW) / 2);
    const startY = Math.max(0, (canvas.height - cropH) / 2);

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = cropW;
    tempCanvas.height = cropH;
    const tCtx = tempCanvas.getContext("2d");
    tCtx.drawImage(canvas, startX, startY, cropW, cropH, 0, 0, cropW, cropH);

    handleLoadImageSrc(tempCanvas.toDataURL("image/png"), `Cropped_${imageMeta.name}`);
    setIsCropMode(false);
  };

  // ── 6. Đổi kích thước (Resize Tool) ────────────────────────────────────────
  const handleApplyResize = () => {
    if (!canvasRef.current || resizeW <= 0 || resizeH <= 0) return;
    const canvas = canvasRef.current;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = resizeW;
    tempCanvas.height = resizeH;
    const tCtx = tempCanvas.getContext("2d");
    tCtx.imageSmoothingEnabled = true;
    tCtx.imageSmoothingQuality = "high";
    tCtx.drawImage(canvas, 0, 0, resizeW, resizeH);

    handleLoadImageSrc(tempCanvas.toDataURL("image/png"), `Resized_${imageMeta.name}`);
  };

  // ── 7. Xuất Ảnh / Download ─────────────────────────────────────────────────
  const handleExport = (format = "png") => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const mime = format === "jpg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png";
    const dataUrl = canvas.toDataURL(mime, 0.95);

    const fileName = `RenGoFun_Edited_${imageMeta.name.replace(/\.[^/.]+$/, "")}.${format}`;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Kích hoạt popup thông báo đẩy ra từ góc dưới bên phải trong 3 giây
    triggerDownloadToast({
      fileName,
      title: "Đã tải ảnh về máy!",
      message: `Độ phân giải ${canvas.width} × ${canvas.height} px • Chuẩn 300 DPI`,
      tag: format.toUpperCase(),
    });
  };

  return (
    <div className="editor-page">
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept="image/png,image/jpeg,image/webp,image/bmp"
        onChange={handleFileChange}
      />

      {/* ════════════════════════════════════════════════════════════════════════
         1. TOP TOOLBAR
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="editor-top-bar">
        <div className="editor-bar-left">
          <button
            id="btn-open-image"
            className="editor-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Mở hình ảnh mới từ máy tính"
          >
            <Upload size={14} color="var(--accent)" />
            <span>Mở ảnh</span>
          </button>

          <button
            id="btn-undo"
            className="editor-btn"
            onClick={handleUndo}
            disabled={historyIdx <= 0}
            title="Hoàn tác thao tác trước (Ctrl + Z)"
          >
            <Undo2 size={13} />
            <span>Hoàn tác</span>
          </button>

          <button
            id="btn-redo"
            className="editor-btn"
            onClick={handleRedo}
            disabled={historyIdx >= history.length - 1}
            title="Làm lại thao tác vừa hủy (Ctrl + Y)"
          >
            <Redo2 size={13} />
            <span>Làm lại</span>
          </button>

          <button
            id="btn-reset-all"
            className="editor-btn editor-btn-danger"
            onClick={handleResetAll}
            title="Đặt lại toàn bộ thông số về gốc"
          >
            <RotateCcw size={13} />
            <span>Đặt lại gốc</span>
          </button>

          <div className="editor-divider" />

          {/* Nút so sánh Before / After */}
          <button
            id="btn-compare-toggle"
            className={`editor-btn ${isComparing ? "editor-btn-active" : ""}`}
            onMouseDown={() => setIsComparing(true)}
            onMouseUp={() => setIsComparing(false)}
            title="Nhấn giữ hoặc giữ phím Space để xem ảnh gốc"
          >
            <Eye size={14} />
            <span>So sánh Trước/Sau</span>
          </button>
        </div>

        <div className="editor-bar-right">
          <div className="editor-image-meta">
            <span>{imageMeta.name}</span>
            <span className="editor-meta-pill">
              {imageMeta.width} × {imageMeta.height} px • 300 DPI
            </span>
          </div>

          {/* Nút xuất thành phẩm */}
          <button
            id="btn-export-png"
            className="editor-btn editor-btn-primary"
            onClick={() => handleExport("png")}
            title="Xuất ảnh PNG 24-bit Lossless giữ nguyên kênh Alpha"
          >
            <Download size={14} />
            <span>Xuất file PNG</span>
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
         2. WORKSPACE: CONTROL PANELS (LEFT) + CANVAS VIEWPORT (RIGHT)
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="editor-workspace">
        {/* ── CỘT TRÁI: TOOLBOX CONTROLS ── */}
        <div className="editor-toolbox">
          {/* Category Tabs Header */}
          <div className="editor-tabs-bar">
            <button
              className={`editor-tab-item ${activeTab === "color" ? "active" : ""}`}
              onClick={() => setActiveTab("color")}
            >
              <Palette size={13} />
              <span>Màu & Sáng</span>
            </button>
            <button
              className={`editor-tab-item ${activeTab === "geometry" ? "active" : ""}`}
              onClick={() => setActiveTab("geometry")}
            >
              <Crop size={13} />
              <span>Hình học</span>
            </button>
            <button
              className={`editor-tab-item ${activeTab === "details" ? "active" : ""}`}
              onClick={() => setActiveTab("details")}
            >
              <Sparkles size={13} />
              <span>Làm nét & Mờ</span>
            </button>
            <button
              className={`editor-tab-item ${activeTab === "effects" ? "active" : ""}`}
              onClick={() => setActiveTab("effects")}
            >
              <Wand2 size={13} />
              <span>Hiệu ứng</span>
            </button>
            <button
              className={`editor-tab-item ${activeTab === "dtf" ? "active" : ""}`}
              onClick={() => setActiveTab("dtf")}
            >
              <Scissors size={13} />
              <span>Chuẩn in DTF</span>
            </button>
          </div>

          {/* Panel Scrollable Body */}
          <div className="editor-panel-scroll">
            {/* ── TAB 1: CÂN CHỈNH MÀU SẮC & ÁNH SÁNG ── */}
            {activeTab === "color" && (
              <>
                <div className="editor-section-card">
                  <div className="editor-section-title">
                    <span className="editor-section-title-left">
                      <Sun size={14} color="#f59e0b" />
                      Ánh sáng & Tương phản
                    </span>
                  </div>

                  {/* Độ sáng */}
                  <div className="editor-slider-item">
                    <div className="editor-slider-header">
                      <span className="editor-slider-lbl">Độ sáng (Brightness)</span>
                      <span className="editor-slider-val" onClick={() => updateAdj("brightness", 0)}>
                        {adj.brightness > 0 ? `+${adj.brightness}` : adj.brightness}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={adj.brightness}
                      className="editor-range-input"
                      onChange={(e) => updateAdj("brightness", Number(e.target.value))}
                      onMouseUp={handleSliderCommit}
                    />
                  </div>

                  {/* Độ tương phản */}
                  <div className="editor-slider-item">
                    <div className="editor-slider-header">
                      <span className="editor-slider-lbl">Độ tương phản (Contrast)</span>
                      <span className="editor-slider-val" onClick={() => updateAdj("contrast", 0)}>
                        {adj.contrast > 0 ? `+${adj.contrast}` : adj.contrast}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={adj.contrast}
                      className="editor-range-input"
                      onChange={(e) => updateAdj("contrast", Number(e.target.value))}
                      onMouseUp={handleSliderCommit}
                    />
                  </div>

                  {/* Phơi sáng Exposure */}
                  <div className="editor-slider-item">
                    <div className="editor-slider-header">
                      <span className="editor-slider-lbl">Phơi sáng (Exposure EV)</span>
                      <span className="editor-slider-val" onClick={() => updateAdj("exposure", 0)}>
                        {adj.exposure > 0 ? `+${adj.exposure}` : adj.exposure}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-2.0"
                      max="2.0"
                      step="0.1"
                      value={adj.exposure}
                      className="editor-range-input"
                      onChange={(e) => updateAdj("exposure", Number(e.target.value))}
                      onMouseUp={handleSliderCommit}
                    />
                  </div>

                  {/* Gamma */}
                  <div className="editor-slider-item">
                    <div className="editor-slider-header">
                      <span className="editor-slider-lbl">Hiệu chỉnh Gamma</span>
                      <span className="editor-slider-val" onClick={() => updateAdj("gamma", 1.0)}>
                        {adj.gamma}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.4"
                      max="2.4"
                      step="0.1"
                      value={adj.gamma}
                      className="editor-range-input"
                      onChange={(e) => updateAdj("gamma", Number(e.target.value))}
                      onMouseUp={handleSliderCommit}
                    />
                  </div>
                </div>

                <div className="editor-section-card">
                  <div className="editor-section-title">
                    <span className="editor-section-title-left">
                      <Palette size={14} color="#8b5cf6" />
                      Màu sắc & Nhiệt độ
                    </span>
                  </div>

                  {/* Độ bão hòa Saturation */}
                  <div className="editor-slider-item">
                    <div className="editor-slider-header">
                      <span className="editor-slider-lbl">Độ bão hòa (Saturation)</span>
                      <span className="editor-slider-val" onClick={() => updateAdj("saturation", 0)}>
                        {adj.saturation > 0 ? `+${adj.saturation}` : adj.saturation}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={adj.saturation}
                      className="editor-range-input"
                      onChange={(e) => updateAdj("saturation", Number(e.target.value))}
                      onMouseUp={handleSliderCommit}
                    />
                  </div>

                  {/* Vibrance */}
                  <div className="editor-slider-item">
                    <div className="editor-slider-header">
                      <span className="editor-slider-lbl">Rực màu thông minh (Vibrance)</span>
                      <span className="editor-slider-val" onClick={() => updateAdj("vibrance", 0)}>
                        {adj.vibrance > 0 ? `+${adj.vibrance}` : adj.vibrance}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={adj.vibrance}
                      className="editor-range-input"
                      onChange={(e) => updateAdj("vibrance", Number(e.target.value))}
                      onMouseUp={handleSliderCommit}
                    />
                  </div>

                  {/* Nhiệt độ màu Temperature */}
                  <div className="editor-slider-item">
                    <div className="editor-slider-header">
                      <span className="editor-slider-lbl">Nhiệt độ (Temperature: Lạnh / Ấm)</span>
                      <span className="editor-slider-val" onClick={() => updateAdj("temperature", 0)}>
                        {adj.temperature > 0 ? `+${adj.temperature}` : adj.temperature}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={adj.temperature}
                      className="editor-range-input"
                      onChange={(e) => updateAdj("temperature", Number(e.target.value))}
                      onMouseUp={handleSliderCommit}
                    />
                  </div>

                  {/* Sắc thái Tint */}
                  <div className="editor-slider-item">
                    <div className="editor-slider-header">
                      <span className="editor-slider-lbl">Sắc thái (Tint: Lục / Hồng)</span>
                      <span className="editor-slider-val" onClick={() => updateAdj("tint", 0)}>
                        {adj.tint > 0 ? `+${adj.tint}` : adj.tint}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={adj.tint}
                      className="editor-range-input"
                      onChange={(e) => updateAdj("tint", Number(e.target.value))}
                      onMouseUp={handleSliderCommit}
                    />
                  </div>
                </div>
              </>
            )}

            {/* ── TAB 2: BIẾN ĐỔI HÌNH HỌC (GEOMETRY) ── */}
            {activeTab === "geometry" && (
              <>
                {/* Cắt ảnh Crop */}
                <div className="editor-section-card">
                  <div className="editor-section-title">
                    <span className="editor-section-title-left">
                      <Crop size={14} color="#38bdf8" />
                      Cắt khung ảnh (Crop ROI)
                    </span>
                  </div>

                  <div className="editor-aspect-grid">
                    {["free", "1:1", "4:3", "16:9", "3:4"].map((ratio) => (
                      <button
                        key={ratio}
                        className={`editor-aspect-btn ${cropAspect === ratio ? "active" : ""}`}
                        onClick={() => {
                          setCropAspect(ratio);
                          setIsCropMode(true);
                        }}
                      >
                        {ratio.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  <button
                    id="btn-confirm-crop"
                    className="editor-btn editor-btn-primary"
                    style={{ width: "100%", justifyContent: "center" }}
                    onClick={handleApplyCrop}
                  >
                    <Check size={14} />
                    <span>Áp dụng cắt theo tỉ lệ {cropAspect.toUpperCase()}</span>
                  </button>
                </div>

                {/* Xoay & Lật */}
                <div className="editor-section-card">
                  <div className="editor-section-title">
                    <span className="editor-section-title-left">
                      <RotateCw size={14} color="#818cf8" />
                      Xoay & Lật đối xứng
                    </span>
                  </div>

                  <div className="editor-btn-group">
                    <button
                      className="editor-btn"
                      onClick={() => handleRotate90("left")}
                      title="Xoay 90° ngược chiều kim đồng hồ"
                    >
                      <RotateCcw size={13} />
                      -90°
                    </button>
                    <button
                      className="editor-btn"
                      onClick={() => handleRotate90("right")}
                      title="Xoay 90° thuận chiều kim đồng hồ"
                    >
                      <RotateCw size={13} />
                      +90°
                    </button>
                    <button
                      className="editor-btn"
                      onClick={() => handleFlip("h")}
                      title="Lật đối xứng ngang"
                    >
                      <FlipHorizontal size={13} />
                      Ngang
                    </button>
                    <button
                      className="editor-btn"
                      onClick={() => handleFlip("v")}
                      title="Lật đối xứng dọc"
                    >
                      <FlipVertical size={13} />
                      Dọc
                    </button>
                  </div>
                </div>

                {/* Đổi kích thước Resize */}
                <div className="editor-section-card">
                  <div className="editor-section-title">
                    <span className="editor-section-title-left">
                      <Maximize2 size={14} color="#10b981" />
                      Đổi kích thước (Resize / Resampling)
                    </span>
                  </div>

                  <div className="editor-input-grid">
                    <div className="editor-input-wrap">
                      <span className="editor-input-lbl">Chiều rộng (W)</span>
                      <input
                        type="number"
                        className="editor-num-input"
                        value={resizeW}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setResizeW(val);
                          if (lockAspect && imageMeta.width > 0) {
                            setResizeH(Math.round((val * imageMeta.height) / imageMeta.width));
                          }
                        }}
                      />
                    </div>
                    <div className="editor-input-wrap">
                      <span className="editor-input-lbl">Chiều cao (H)</span>
                      <input
                        type="number"
                        className="editor-num-input"
                        value={resizeH}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setResizeH(val);
                          if (lockAspect && imageMeta.height > 0) {
                            setResizeW(Math.round((val * imageMeta.width) / imageMeta.height));
                          }
                        }}
                      />
                    </div>
                  </div>

                  <label className="editor-toggle-row">
                    <span className="editor-toggle-lbl">Khóa tỉ lệ khung hình</span>
                    <label className="editor-switch">
                      <input
                        type="checkbox"
                        checked={lockAspect}
                        onChange={(e) => setLockAspect(e.target.checked)}
                      />
                      <span className="editor-switch-slider" />
                    </label>
                  </label>

                  <button
                    id="btn-apply-resize"
                    className="editor-btn"
                    style={{ width: "100%", justifyContent: "center" }}
                    onClick={handleApplyResize}
                  >
                    <span>Áp dụng kích thước mới (Bicubic / Lanczos)</span>
                  </button>
                </div>
              </>
            )}

            {/* ── TAB 3: CHI TIẾT & BỘ LỌC KHÔNG GIAN ── */}
            {activeTab === "details" && (
              <div className="editor-section-card">
                <div className="editor-section-title">
                  <span className="editor-section-title-left">
                    <Sparkles size={14} color="#06b6d4" />
                    Độ nét, Mờ & Khử nhiễu
                  </span>
                </div>

                {/* Làm sắc nét Sharpen */}
                <div className="editor-slider-item">
                  <div className="editor-slider-header">
                    <span className="editor-slider-lbl">Làm sắc nét (Unsharp Mask)</span>
                    <span className="editor-slider-val" onClick={() => updateAdj("sharpen", 0)}>
                      {adj.sharpen}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={adj.sharpen}
                    className="editor-range-input"
                    onChange={(e) => updateAdj("sharpen", Number(e.target.value))}
                    onMouseUp={handleSliderCommit}
                  />
                </div>

                {/* Làm mờ Gaussian Blur */}
                <div className="editor-slider-item">
                  <div className="editor-slider-header">
                    <span className="editor-slider-lbl">Làm mờ (Gaussian Blur Radius)</span>
                    <span className="editor-slider-val" onClick={() => updateAdj("blur", 0)}>
                      {adj.blur}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={adj.blur}
                    className="editor-range-input"
                    onChange={(e) => updateAdj("blur", Number(e.target.value))}
                    onMouseUp={handleSliderCommit}
                  />
                </div>

                {/* Khử nhiễu hạt Denoise */}
                <div className="editor-slider-item">
                  <div className="editor-slider-header">
                    <span className="editor-slider-lbl">Khử nhiễu hạt (Median Denoising)</span>
                    <span className="editor-slider-val" onClick={() => updateAdj("denoise", 0)}>
                      {adj.denoise}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={adj.denoise}
                    className="editor-range-input"
                    onChange={(e) => updateAdj("denoise", Number(e.target.value))}
                    onMouseUp={handleSliderCommit}
                  />
                </div>
              </div>
            )}

            {/* ── TAB 4: HIỆU ỨNG & BỘ LỌC NGHỆ THUẬT ── */}
            {activeTab === "effects" && (
              <div className="editor-section-card">
                <div className="editor-section-title">
                  <span className="editor-section-title-left">
                    <Wand2 size={14} color="#ec4899" />
                    Bộ lọc màu & Hiệu ứng
                  </span>
                </div>

                {/* Đen trắng Grayscale */}
                <label className="editor-toggle-row">
                  <span className="editor-toggle-lbl">Đen trắng chuẩn BT.709</span>
                  <label className="editor-switch">
                    <input
                      type="checkbox"
                      checked={adj.grayscale}
                      onChange={(e) => updateAdj("grayscale", e.target.checked)}
                    />
                    <span className="editor-switch-slider" />
                  </label>
                </label>

                {/* Đảo màu Invert */}
                <label className="editor-toggle-row">
                  <span className="editor-toggle-lbl">Đảo ngược màu sắc (Invert)</span>
                  <label className="editor-switch">
                    <input
                      type="checkbox"
                      checked={adj.invert}
                      onChange={(e) => updateAdj("invert", e.target.checked)}
                    />
                    <span className="editor-switch-slider" />
                  </label>
                </label>

                {/* Cổ điển Sepia */}
                <div className="editor-slider-item">
                  <div className="editor-slider-header">
                    <span className="editor-slider-lbl">Tone cổ điển (Sepia)</span>
                    <span className="editor-slider-val" onClick={() => updateAdj("sepia", 0)}>
                      {adj.sepia}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={adj.sepia}
                    className="editor-range-input"
                    onChange={(e) => updateAdj("sepia", Number(e.target.value))}
                    onMouseUp={handleSliderCommit}
                  />
                </div>

                {/* Viền tối Vignette */}
                <div className="editor-slider-item">
                  <div className="editor-slider-header">
                    <span className="editor-slider-lbl">Viền tối 4 góc (Vignette)</span>
                    <span className="editor-slider-val" onClick={() => updateAdj("vignette", 0)}>
                      {adj.vignette}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={adj.vignette}
                    className="editor-range-input"
                    onChange={(e) => updateAdj("vignette", Number(e.target.value))}
                    onMouseUp={handleSliderCommit}
                  />
                </div>
              </div>
            )}

            {/* ── TAB 5: CHUẨN IN ẤN DTF & XỬ LÝ VIỀN ── */}
            {activeTab === "dtf" && (
              <div className="editor-section-card">
                <div className="editor-section-title">
                  <span className="editor-section-title-left">
                    <Scissors size={14} color="#818cf8" />
                    Xử lý viền in màng DTF
                  </span>
                </div>

                <label className="editor-toggle-row">
                  <div>
                    <div className="editor-toggle-lbl">Làm cứng viền bán trong suốt</div>
                    <div style={{ fontSize: "0.64rem", color: "var(--text-muted)" }}>
                      Ép Alpha &gt; 12 thành 255 đục, giữ nguyên màu sắc
                    </div>
                  </div>
                  <label className="editor-switch">
                    <input
                      type="checkbox"
                      checked={adj.hardenAlpha}
                      onChange={(e) => updateAdj("hardenAlpha", e.target.checked)}
                    />
                    <span className="editor-switch-slider" />
                  </label>
                </label>

                <div className="editor-divider" style={{ width: "100%", height: 1 }} />

                <button
                  className="editor-btn"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={() => {
                    updateAdj("hardenAlpha", true);
                    updateAdj("sharpen", 35);
                    pushHistory({ ...adj, hardenAlpha: true, sharpen: 35 });
                  }}
                >
                  <Sparkles size={14} color="#818cf8" />
                  <span>Áp dụng Preset Khử viền + Tăng nét in áo</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── CỘT PHẢI: INTERACTIVE CANVAS VIEWPORT ── */}
        <div className="editor-canvas-card">
          <div className="editor-viewport-top">
            <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
              Bản xem trước trực tiếp (Live Canvas 60fps)
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                className={`editor-btn ${zoomLevel === 1.0 ? "editor-btn-active" : ""}`}
                style={{ padding: "3px 9px", fontSize: "0.68rem" }}
                onClick={() => setZoomLevel(1.0)}
              >
                100%
              </button>
              <button
                className={`editor-btn ${zoomLevel === 1.5 ? "editor-btn-active" : ""}`}
                style={{ padding: "3px 9px", fontSize: "0.68rem" }}
                onClick={() => setZoomLevel(1.5)}
              >
                150%
              </button>
              <button
                className={`editor-btn ${zoomLevel === 2.0 ? "editor-btn-active" : ""}`}
                style={{ padding: "3px 9px", fontSize: "0.68rem" }}
                onClick={() => setZoomLevel(2.0)}
              >
                200%
              </button>
            </div>
          </div>

          <div className="editor-viewport-area">
            {sourceImage ? (
              <>
                <canvas
                  id="editorCanvas"
                  ref={canvasRef}
                  className="editor-canvas-element"
                  style={{ transform: `scale(${zoomLevel})` }}
                />

                {isComparing && (
                  <div className="editor-compare-badge">Ảnh Gốc (Original)</div>
                )}
              </>
            ) : (
              <div className="editor-empty-state">
                <div className="editor-empty-icon">
                  <ImageIcon size={32} />
                </div>
                <div className="editor-empty-title">Chưa có ảnh nào được chọn</div>
                <div className="editor-empty-sub">
                  Kéo thả file ảnh vào đây hoặc bấm nút Mở ảnh để bắt đầu chỉnh sửa
                </div>
                <div className="editor-sample-btns">
                  <button
                    className="editor-btn"
                    onClick={() => handleLoadImageSrc(createEditorDemoSvg("cyber"), "Demo_Cyber_Skull.png")}
                  >
                    Nạp ảnh mẫu Cyber Skull
                  </button>
                  <button
                    className="editor-btn"
                    onClick={() => handleLoadImageSrc(createEditorDemoSvg("tiger"), "Demo_Retro_Tiger.png")}
                  >
                    Nạp ảnh mẫu Retro Tiger
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

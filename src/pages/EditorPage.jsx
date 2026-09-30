import { useState, useRef } from "react";
import "../App.css";

// ── Single-image filter options ─────────────────────────────────────────────
const FILTER_OPTIONS = [
  {
    id: "grayscale",
    label: "Trắng đen",
    icon: "◑",
    description: "Chuyển ảnh sang thang độ xám",
    endpoint: "http://localhost:8000/process-image",
  },
  {
    id: "harden-edge",
    label: "Tăng sắc nét viền",
    icon: "✦",
    description: "Làm cứng viền bán trong suốt, giữ nguyên màu gốc",
    endpoint: "http://localhost:8000/process-image-harden",
  },
  {
    id: "denoise-deskew",
    label: "Làm sạch tạp âm & bẻ thẳng",
    icon: "🧹",
    description: "Khử nhiễu hạt, làm trắng nền giấy scan, tự động chỉnh phối cảnh",
    endpoint: "http://localhost:8000/process-image-denoise",
  },
  {
    id: "smooth-contour",
    label: "Làm mượt viền & xoá đen",
    icon: "✂️",
    description: "Bo mượt viền bế, xoá viền đen thừa trên ảnh nền trong suốt",
    endpoint: "http://localhost:8000/process-image-smooth-contour",
  },
  {
    id: "batch",
    label: "Xử lý hàng loạt",
    icon: "⚡",
    description: "Resize, Crop, Watermark, đổi đuôi nhiều ảnh cùng lúc",
    isBatch: true,
  },
  {
    id: "blur-detect",
    label: "Lọc ảnh mờ nhòe",
    icon: "🔍",
    description: "Dò ảnh out nét bằng Laplacian Variance, đánh dấu đỏ ảnh lỗi",
    isBlurDetect: true,
  },
  // Dễ dàng thêm filter mới vào đây sau
];

// ── Default batch config ─────────────────────────────────────────────────────
const DEFAULT_BATCH = {
  resizeEnabled: false,
  resizeWidth: 1920,
  resizeHeight: 0,
  cropEnabled: false,
  cropRatioW: 16,
  cropRatioH: 9,
  wmEnabled: false,
  wmText: "© RenGoFun",
  wmOpacity: 0.35,
  wmPosition: "bottom-right",
  wmFontScale: 1.0,
  outputFormat: "png",
};

// ── File status constants ─────────────────────────────────────────────────────
const STATUS = { PENDING: "pending", PROCESSING: "processing", DONE: "done", ERROR: "error" };

// ── Blur quality label ───────────────────────────────────────────────────────
const blurLabel = (score, threshold) => {
  if (score === null) return null;
  const ratio = score / threshold;
  if (ratio >= 2.0) return { text: "Rất nét", cls: "blur-tag--sharp" };
  if (ratio >= 1.0) return { text: "Nét",     cls: "blur-tag--sharp" };
  if (ratio >= 0.5) return { text: "Hơi mờ",  cls: "blur-tag--warn" };
  return               { text: "Mờ nhòe",  cls: "blur-tag--blurry" };
};

// ═════════════════════════════════════════════════════════════════════════════
function EditorPage() {
  // ── Single-image state ─────────────────────────────────────────────────────
  const [originalImage, setOriginalImage]   = useState(null);
  const [originalFile, setOriginalFile]     = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [activeFilter, setActiveFilter]     = useState(null);
  const [isLoading, setIsLoading]           = useState(false);
  const fileInputRef = useRef(null);

  // ── Batch state ────────────────────────────────────────────────────────────
  const [batchFiles, setBatchFiles]     = useState([]);
  const [batchConfig, setBatchConfig]   = useState(DEFAULT_BATCH);
  const [batchRunning, setBatchRunning] = useState(false);
  const [zipUrl, setZipUrl]             = useState(null);
  const batchInputRef = useRef(null);

  // ── Blur-detect state ─────────────────────────────────────────────────────
  // blurFiles: [{file, name, status, score, blurry, preview}]
  const [blurFiles, setBlurFiles]         = useState([]);
  const [blurThreshold, setBlurThreshold] = useState(100);
  const [blurRunning, setBlurRunning]     = useState(false);
  const [blurDone, setBlurDone]           = useState(false);
  const blurInputRef = useRef(null);

  // ── Single: download ──────────────────────────────────────────────────────
  const handleDownload = () => {
    if (!processedImage || !originalFile) return;
    const baseName = originalFile.name.replace(/\.[^.]+$/, "");
    const suffix   = activeFilter?.id ?? "processed";
    const link = document.createElement("a");
    link.href = processedImage;
    link.download = `${baseName}_${suffix}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Single: upload ────────────────────────────────────────────────────────
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setOriginalImage(URL.createObjectURL(file));
    setOriginalFile(file);
    setProcessedImage(null);
    setActiveFilter(null);
  };

  // ── Single / mode switch ──────────────────────────────────────────────────
  const handleFilterSelect = async (filter) => {
    if (filter.isBatch || filter.isBlurDetect) {
      setActiveFilter(filter);
      return;
    }
    if (!originalFile) return;
    if (activeFilter?.id === filter.id && processedImage) return;

    setActiveFilter(filter);
    setProcessedImage(null);
    setIsLoading(true);

    const formData = new FormData();
    formData.append("file", originalFile);

    try {
      const res = await fetch(filter.endpoint, { method: "POST", body: formData });
      if (res.ok) {
        const blob = await res.blob();
        setProcessedImage(URL.createObjectURL(blob));
      } else {
        alert("Lỗi xử lý từ Python Backend!");
        setActiveFilter(null);
      }
    } catch {
      alert("Không thể kết nối đến Python. Bạn đã bật uvicorn chưa?");
      setActiveFilter(null);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Batch: chọn file ──────────────────────────────────────────────────────
  const handleBatchFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setBatchFiles(files.map((f) => ({ file: f, name: f.name, status: STATUS.PENDING })));
    setZipUrl(null);
    e.target.value = "";
  };

  const removeBatchFile = (idx) => setBatchFiles((prev) => prev.filter((_, i) => i !== idx));
  const setCfg = (key, val) => setBatchConfig((prev) => ({ ...prev, [key]: val }));

  // ── Batch: chạy ──────────────────────────────────────────────────────────
  const runBatch = async () => {
    if (!batchFiles.length) return;
    setBatchRunning(true);
    setZipUrl(null);
    setBatchFiles((prev) => prev.map((f) => ({ ...f, status: STATUS.PROCESSING })));

    const formData = new FormData();
    batchFiles.forEach(({ file }) => formData.append("files", file));
    formData.append("resize_enabled", batchConfig.resizeEnabled);
    formData.append("resize_width",   batchConfig.resizeWidth);
    formData.append("resize_height",  batchConfig.resizeHeight);
    formData.append("crop_enabled",   batchConfig.cropEnabled);
    formData.append("crop_ratio_w",   batchConfig.cropRatioW);
    formData.append("crop_ratio_h",   batchConfig.cropRatioH);
    formData.append("wm_enabled",     batchConfig.wmEnabled);
    formData.append("wm_text",        batchConfig.wmText);
    formData.append("wm_opacity",     batchConfig.wmOpacity);
    formData.append("wm_position",    batchConfig.wmPosition);
    formData.append("wm_font_scale",  batchConfig.wmFontScale);
    formData.append("output_format",  batchConfig.outputFormat);

    try {
      const res = await fetch("http://localhost:8000/process-batch", { method: "POST", body: formData });
      if (res.ok) {
        const blob = await res.blob();
        setZipUrl(URL.createObjectURL(blob));
        setBatchFiles((prev) => prev.map((f) => ({ ...f, status: STATUS.DONE })));
      } else {
        setBatchFiles((prev) => prev.map((f) => ({ ...f, status: STATUS.ERROR })));
        alert("Lỗi xử lý từ Python Backend!");
      }
    } catch {
      setBatchFiles((prev) => prev.map((f) => ({ ...f, status: STATUS.ERROR })));
      alert("Không thể kết nối đến Python. Bạn đã bật uvicorn chưa?");
    } finally {
      setBatchRunning(false);
    }
  };

  // ── Blur-detect: chọn file ────────────────────────────────────────────────
  const handleBlurFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setBlurFiles(
      files.map((f) => ({
        file: f,
        name: f.name,
        status: STATUS.PENDING,
        score: null,
        blurry: null,
        preview: URL.createObjectURL(f),
      }))
    );
    setBlurDone(false);
    e.target.value = "";
  };

  const removeBlurFile = (idx) => setBlurFiles((prev) => prev.filter((_, i) => i !== idx));

  // ── Blur-detect: chạy kiểm tra ───────────────────────────────────────────
  const runBlurCheck = async () => {
    if (!blurFiles.length) return;
    setBlurRunning(true);
    setBlurDone(false);
    setBlurFiles((prev) => prev.map((f) => ({ ...f, status: STATUS.PROCESSING, score: null, blurry: null })));

    const formData = new FormData();
    blurFiles.forEach(({ file }) => formData.append("files", file));
    formData.append("threshold", blurThreshold);

    try {
      const res = await fetch("http://localhost:8000/check-blur-batch", { method: "POST", body: formData });
      if (res.ok) {
        const results = await res.json(); // [{filename, score, blurry}, ...]
        setBlurFiles((prev) =>
          prev.map((f, i) => ({
            ...f,
            status: STATUS.DONE,
            score:  results[i]?.score  ?? null,
            blurry: results[i]?.blurry ?? false,
          }))
        );
        setBlurDone(true);
      } else {
        setBlurFiles((prev) => prev.map((f) => ({ ...f, status: STATUS.ERROR })));
        alert("Lỗi từ Python Backend!");
      }
    } catch {
      setBlurFiles((prev) => prev.map((f) => ({ ...f, status: STATUS.ERROR })));
      alert("Không thể kết nối đến Python. Bạn đã bật uvicorn chưa?");
    } finally {
      setBlurRunning(false);
    }
  };

  // ── Blur-detect: xoá ảnh mờ khỏi danh sách ───────────────────────────────
  const removeBlurryFiles = () => {
    setBlurFiles((prev) => prev.filter((f) => !f.blurry));
    setBlurDone(false);
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const isBatchMode      = activeFilter?.isBatch;
  const isBlurDetectMode = activeFilter?.isBlurDetect;

  const statusIcon = (s) =>
    s === STATUS.PROCESSING ? <span className="file-row__spinner" />
    : s === STATUS.DONE     ? <span className="file-row__check">✓</span>
    : s === STATUS.ERROR    ? <span className="file-row__err">✕</span>
    : null;

  const blurryCount = blurFiles.filter((f) => f.blurry).length;
  const sharpCount  = blurFiles.filter((f) => f.blurry === false).length;

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <main className="app-container">
      {/* ── Header ── */}
      <header className="app-header">
        <h1 className="app-title">RenGoFun Editor</h1>
        <p className="app-subtitle">Chọn ảnh và áp dụng hiệu ứng chỉnh sửa</p>
      </header>

      {/* ── Upload zone (single image) ── */}
      {!isBatchMode && !isBlurDetectMode && (
        <div
          className={`upload-zone ${originalImage ? "has-image" : ""}`}
          onClick={() => fileInputRef.current?.click()}
        >
          {originalImage ? (
            <span className="upload-zone__hint">📁 Nhấn để đổi ảnh khác</span>
          ) : (
            <>
              <span className="upload-zone__icon">🖼️</span>
              <span className="upload-zone__text">Kéo thả hoặc nhấn để chọn ảnh</span>
              <span className="upload-zone__hint">PNG, JPG, WEBP...</span>
            </>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
        </div>
      )}

      {/* ── Editor layout ── */}
      {(originalImage || isBatchMode || isBlurDetectMode) && (
        <div className="editor-layout">

          {/* ── Cột trái ── */}
          <div className="image-panel">
            {isBlurDetectMode ? (
              /* ── Blur-detect: drop zone + file list ── */
              <>
                <div className="panel-label">Ảnh cần kiểm tra</div>
                <div
                  className={`upload-zone upload-zone--batch ${blurFiles.length ? "has-image" : ""}`}
                  onClick={() => blurInputRef.current?.click()}
                >
                  {blurFiles.length ? (
                    <span className="upload-zone__hint">📁 Nhấn để thêm / đổi ảnh</span>
                  ) : (
                    <>
                      <span className="upload-zone__icon">🔍</span>
                      <span className="upload-zone__text">Chọn nhiều ảnh để kiểm tra độ nét</span>
                      <span className="upload-zone__hint">PNG, JPG, WEBP...</span>
                    </>
                  )}
                  <input ref={blurInputRef} type="file" accept="image/*" multiple
                    onChange={handleBlurFileSelect} style={{ display: "none" }} />
                </div>

                {/* Danh sách file blur */}
                {blurFiles.length > 0 && (
                  <ul className="file-list">
                    {blurFiles.map((f, i) => (
                      <li key={i} className={`file-row ${
                        f.blurry === true  ? "file-row--blurry" :
                        f.blurry === false ? "file-row--sharp"  :
                        `file-row--${f.status}`
                      }`}>
                        {/* Thumbnail nhỏ */}
                        <img src={f.preview} alt="" className="file-row__thumb" />
                        <span className="file-row__name" title={f.name}>{f.name}</span>
                        {/* Score badge */}
                        {f.score !== null && (() => {
                          const lb = blurLabel(f.score, blurThreshold);
                          return (
                            <span className={`blur-tag ${lb.cls}`}>
                              {f.score.toFixed(0)} · {lb.text}
                            </span>
                          );
                        })()}
                        <span className="file-row__status">{statusIcon(f.status)}</span>
                        {!blurRunning && (
                          <button className="file-row__remove" onClick={() => removeBlurFile(i)} title="Xoá">×</button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Nút hành động blur */}
                <div className="batch-actions">
                  <button className="btn-run btn-run--blue"
                    onClick={runBlurCheck}
                    disabled={blurRunning || !blurFiles.length}
                  >
                    {blurRunning
                      ? <><span className="filter-item__spinner" /> Đang phân tích...</>
                      : <><span>🔍</span> Kiểm tra độ nét</>
                    }
                  </button>
                  {blurDone && blurryCount > 0 && (
                    <button className="btn-remove-blurry" onClick={removeBlurryFiles}>
                      🗑 Xoá {blurryCount} ảnh mờ khỏi danh sách
                    </button>
                  )}
                </div>
              </>
            ) : isBatchMode ? (
              /* ── Batch: drop zone + file list ── */
              <>
                <div className="panel-label">Ảnh hàng loạt</div>
                <div
                  className={`upload-zone upload-zone--batch ${batchFiles.length ? "has-image" : ""}`}
                  onClick={() => batchInputRef.current?.click()}
                >
                  {batchFiles.length ? (
                    <span className="upload-zone__hint">📁 Nhấn để thêm / đổi ảnh</span>
                  ) : (
                    <>
                      <span className="upload-zone__icon">📂</span>
                      <span className="upload-zone__text">Nhấn để chọn nhiều ảnh</span>
                      <span className="upload-zone__hint">Hỗ trợ chọn cùng lúc nhiều file</span>
                    </>
                  )}
                  <input ref={batchInputRef} type="file" accept="image/*" multiple
                    onChange={handleBatchFileSelect} style={{ display: "none" }} />
                </div>

                {batchFiles.length > 0 && (
                  <ul className="file-list">
                    {batchFiles.map((f, i) => (
                      <li key={i} className={`file-row file-row--${f.status}`}>
                        <span className="file-row__name" title={f.name}>{f.name}</span>
                        <span className="file-row__status">{statusIcon(f.status)}</span>
                        {!batchRunning && f.status !== STATUS.PROCESSING && (
                          <button className="file-row__remove" onClick={() => removeBatchFile(i)} title="Xoá">×</button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="batch-actions">
                  <button className="btn-run" onClick={runBatch}
                    disabled={batchRunning || !batchFiles.length}>
                    {batchRunning
                      ? <><span className="filter-item__spinner" /> Đang xử lý...</>
                      : <><span>⚡</span> Chạy hàng loạt</>
                    }
                  </button>
                  {zipUrl && (
                    <a className="btn-download" href={zipUrl} download="batch_output.zip">
                      <span className="btn-download__icon">⬇</span>
                      Tải ZIP về máy
                    </a>
                  )}
                </div>
              </>
            ) : (
              /* ── Single image: preview gốc ── */
              <>
                <div className="panel-label">Ảnh gốc</div>
                <img src={originalImage} alt="Original" className="preview-image" />
              </>
            )}
          </div>

          {/* ── Cột giữa: filter list ── */}
          <div className="filter-panel">
            <div className="panel-label">Chọn hiệu ứng</div>
            <ul className="filter-list">
              {FILTER_OPTIONS.map((filter) => (
                <li
                  key={filter.id}
                  className={`filter-item ${activeFilter?.id === filter.id ? "active" : ""}`}
                  onClick={() => handleFilterSelect(filter)}
                >
                  <span className="filter-item__icon">{filter.icon}</span>
                  <div className="filter-item__info">
                    <span className="filter-item__label">{filter.label}</span>
                    <span className="filter-item__desc">{filter.description}</span>
                  </div>
                  {activeFilter?.id === filter.id && isLoading && (
                    <span className="filter-item__spinner" />
                  )}
                  {activeFilter?.id === filter.id && !isLoading && processedImage &&
                    !filter.isBatch && !filter.isBlurDetect && (
                    <span className="filter-item__check">✓</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* ── Cột phải: kết quả / config ── */}
          <div className="image-panel">
            {isBlurDetectMode ? (
              /* ── Blur-detect config + summary ── */
              <>
                <div className="panel-label">Cấu hình & Kết quả</div>
                <div className="batch-config">

                  {/* Ngưỡng Laplacian */}
                  <div className="cfg-section cfg-section--active">
                    <div className="cfg-toggle cfg-toggle--static">
                      <span className="cfg-toggle__icon">📐</span>
                      <span className="cfg-toggle__label">Ngưỡng phát hiện mờ</span>
                    </div>
                    <div className="cfg-col">
                      <div className="cfg-field cfg-field--full">
                        <label>Laplacian Variance ≥ {blurThreshold} → Nét</label>
                        <input type="range" min="10" max="500" step="5"
                          value={blurThreshold}
                          onChange={(e) => {
                            setBlurThreshold(+e.target.value);
                            setBlurDone(false);
                          }} />
                      </div>
                      <div className="blur-threshold-presets">
                        {[
                          { label: "Nghiêm ngặt", val: 200 },
                          { label: "Cân bằng",    val: 100 },
                          { label: "Dễ tính",      val: 40  },
                        ].map(({ label, val }) => (
                          <button key={val}
                            className={`cfg-preset-btn ${blurThreshold === val ? "active" : ""}`}
                            onClick={() => { setBlurThreshold(val); setBlurDone(false); }}>
                            {label} ({val})
                          </button>
                        ))}
                      </div>
                      <p className="cfg-hint">
                        Thấp = dễ bị đánh dấu mờ · Cao = chỉ loại ảnh cực mờ
                      </p>
                    </div>
                  </div>

                  {/* Bảng tóm tắt */}
                  {blurDone && (
                    <div className="blur-summary">
                      <div className="blur-summary__row blur-summary__row--sharp">
                        <span className="blur-summary__icon">✅</span>
                        <span className="blur-summary__label">Ảnh nét</span>
                        <span className="blur-summary__count">{sharpCount}</span>
                      </div>
                      <div className="blur-summary__row blur-summary__row--blurry">
                        <span className="blur-summary__icon">🔴</span>
                        <span className="blur-summary__label">Ảnh mờ / lỗi</span>
                        <span className="blur-summary__count">{blurryCount}</span>
                      </div>
                      <div className="blur-summary__row">
                        <span className="blur-summary__icon">📊</span>
                        <span className="blur-summary__label">Tổng cộng</span>
                        <span className="blur-summary__count">{blurFiles.length}</span>
                      </div>
                    </div>
                  )}

                  {/* Hướng dẫn */}
                  <div className="cfg-section">
                    <div className="cfg-toggle cfg-toggle--static">
                      <span className="cfg-toggle__icon">💡</span>
                      <span className="cfg-toggle__label">Cách hoạt động</span>
                    </div>
                    <p className="blur-explain">
                      Thuật toán tính <strong>phương sai Laplacian</strong> của ảnh xám.
                      Ảnh nét có cạnh rõ → phương sai cao. Ảnh mờ → phương sai thấp.
                      Nếu điểm số &lt; ngưỡng → đánh dấu 🔴 <em>mờ nhòe</em>.
                    </p>
                  </div>

                </div>
              </>
            ) : isBatchMode ? (
              /* ── Batch config ── */
              <>
                <div className="panel-label">Cấu hình xử lý</div>
                <div className="batch-config">

                  <div className="cfg-section">
                    <label className="cfg-toggle">
                      <input type="checkbox" checked={batchConfig.resizeEnabled}
                        onChange={(e) => setCfg("resizeEnabled", e.target.checked)} />
                      <span className="cfg-toggle__icon">↔</span>
                      <span className="cfg-toggle__label">Resize</span>
                    </label>
                    {batchConfig.resizeEnabled && (
                      <div className="cfg-row">
                        <div className="cfg-field">
                          <label>Rộng tối đa (px)</label>
                          <input type="number" min="0" value={batchConfig.resizeWidth}
                            onChange={(e) => setCfg("resizeWidth", +e.target.value)} />
                        </div>
                        <div className="cfg-field">
                          <label>Cao tối đa (px)</label>
                          <input type="number" min="0" value={batchConfig.resizeHeight}
                            onChange={(e) => setCfg("resizeHeight", +e.target.value)} />
                        </div>
                        <p className="cfg-hint">0 = tự tính theo tỉ lệ</p>
                      </div>
                    )}
                  </div>

                  <div className="cfg-section">
                    <label className="cfg-toggle">
                      <input type="checkbox" checked={batchConfig.cropEnabled}
                        onChange={(e) => setCfg("cropEnabled", e.target.checked)} />
                      <span className="cfg-toggle__icon">✂</span>
                      <span className="cfg-toggle__label">Crop tỉ lệ</span>
                    </label>
                    {batchConfig.cropEnabled && (
                      <div className="cfg-row">
                        <div className="cfg-field">
                          <label>Tỉ lệ W</label>
                          <input type="number" min="1" value={batchConfig.cropRatioW}
                            onChange={(e) => setCfg("cropRatioW", +e.target.value)} />
                        </div>
                        <span className="cfg-divider">:</span>
                        <div className="cfg-field">
                          <label>Tỉ lệ H</label>
                          <input type="number" min="1" value={batchConfig.cropRatioH}
                            onChange={(e) => setCfg("cropRatioH", +e.target.value)} />
                        </div>
                        <div className="cfg-presets">
                          {[["16","9"],["4","3"],["1","1"],["9","16"]].map(([w,h]) => (
                            <button key={`${w}:${h}`} className="cfg-preset-btn"
                              onClick={() => { setCfg("cropRatioW", +w); setCfg("cropRatioH", +h); }}>
                              {w}:{h}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="cfg-section">
                    <label className="cfg-toggle">
                      <input type="checkbox" checked={batchConfig.wmEnabled}
                        onChange={(e) => setCfg("wmEnabled", e.target.checked)} />
                      <span className="cfg-toggle__icon">©</span>
                      <span className="cfg-toggle__label">Watermark</span>
                    </label>
                    {batchConfig.wmEnabled && (
                      <div className="cfg-col">
                        <div className="cfg-field cfg-field--full">
                          <label>Nội dung chữ</label>
                          <input type="text" value={batchConfig.wmText}
                            onChange={(e) => setCfg("wmText", e.target.value)} />
                        </div>
                        <div className="cfg-row">
                          <div className="cfg-field">
                            <label>Độ mờ ({Math.round(batchConfig.wmOpacity * 100)}%)</label>
                            <input type="range" min="0.05" max="1" step="0.05"
                              value={batchConfig.wmOpacity}
                              onChange={(e) => setCfg("wmOpacity", +e.target.value)} />
                          </div>
                          <div className="cfg-field">
                            <label>Cỡ chữ ({batchConfig.wmFontScale.toFixed(1)}×)</label>
                            <input type="range" min="0.5" max="4" step="0.1"
                              value={batchConfig.wmFontScale}
                              onChange={(e) => setCfg("wmFontScale", +e.target.value)} />
                          </div>
                        </div>
                        <div className="cfg-field cfg-field--full">
                          <label>Vị trí</label>
                          <select value={batchConfig.wmPosition}
                            onChange={(e) => setCfg("wmPosition", e.target.value)}>
                            <option value="bottom-right">Góc dưới phải</option>
                            <option value="bottom-left">Góc dưới trái</option>
                            <option value="top-right">Góc trên phải</option>
                            <option value="top-left">Góc trên trái</option>
                            <option value="center">Giữa ảnh</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="cfg-section">
                    <div className="cfg-toggle cfg-toggle--static">
                      <span className="cfg-toggle__icon">🗂</span>
                      <span className="cfg-toggle__label">Định dạng đầu ra</span>
                    </div>
                    <div className="cfg-format-group">
                      {["png","jpg","webp"].map((fmt) => (
                        <button key={fmt}
                          className={`cfg-fmt-btn ${batchConfig.outputFormat === fmt ? "active" : ""}`}
                          onClick={() => setCfg("outputFormat", fmt)}>
                          .{fmt.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </>
            ) : (
              /* ── Single image result ── */
              <>
                <div className="panel-label">
                  {activeFilter ? `Kết quả: ${activeFilter.label}` : "Kết quả"}
                </div>
                {isLoading ? (
                  <div className="result-placeholder loading">
                    <span className="spinner-ring" />
                    <span>Đang xử lý...</span>
                  </div>
                ) : processedImage ? (
                  <>
                    <img src={processedImage} alt="Processed" className="preview-image" />
                    <button className="btn-download" onClick={handleDownload}>
                      <span className="btn-download__icon">⬇</span>
                      Tải ảnh về máy
                    </button>
                  </>
                ) : (
                  <div className="result-placeholder">
                    <span>← Chọn một hiệu ứng để xem kết quả</span>
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      )}
    </main>
  );
}

export default EditorPage;

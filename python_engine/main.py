from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import Response, StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import zipfile
import io
from typing import List, Optional
from PIL import Image

app = FastAPI()

# Cấp quyền cho giao diện Tauri (React) đọc dữ liệu trả về
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/process-image")
async def process_image(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    
    # 1. Dùng cv2.IMREAD_UNCHANGED để giữ lại toàn bộ các kênh (kể cả kênh Alpha trong suốt)
    img = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)

    # 2. Kiểm tra xem ảnh có kênh Alpha (4 kênh: BGRA) hay không
    if len(img.shape) == 3 and img.shape[2] == 4:
        # Tách phần màu (BGR) và phần trong suốt (Alpha)
        bgr = img[:, :, :3]
        alpha = img[:, :, 3]

        # Chuyển phần màu sang trắng đen (tạo ra ảnh 1 kênh màu)
        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)

        # Ghép kênh trắng đen và kênh Alpha lại với nhau thành ảnh BGRA mới
        gray_image = cv2.merge([gray, gray, gray, alpha])
    else:
        # Nếu ảnh không có nền trong suốt (JPG, etc.), xử lý như bình thường
        gray_image = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 3. Encode lại thành PNG (bắt buộc dùng .png để giữ được nền trong suốt khi trả về)
    _, encoded_img = cv2.imencode('.png', gray_image)
    return Response(content=encoded_img.tobytes(), media_type="image/png")


@app.post("/process-image-harden")
async def process_image_harden(file: UploadFile = File(...)):
    """
    Endpoint làm cứng viền ảnh PNG có nền trong suốt.
    Logic lấy từ make_semi_transparent_opaque_native() (Photoshop script):
    - Giữ nguyên toàn bộ màu sắc gốc (BGRA), KHÔNG chuyển trắng đen.
    - Chỉ ép kênh Alpha: mọi pixel có Alpha > 0 → Alpha = 255 (đục 100%).
    Kết quả: viền bán trong suốt biến mất, màu sắc vật thể được giữ nguyên.
    """
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)

    # Bước 1: IMREAD_UNCHANGED — bắt buộc để giữ kênh Alpha.
    # Nếu dùng IMREAD_COLOR sẽ mất kênh Alpha trước khi xử lý.
    img = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)

    # Bước 2: Chỉ xử lý nếu ảnh có 4 kênh (BGRA)
    if len(img.shape) == 3 and img.shape[2] == 4:

        # Tách kênh màu (BGR) và kênh Alpha thành 2 mảng riêng biệt
        bgr   = img[:, :, :3]   # shape: (H, W, 3) — màu sắc GỐC, giữ nguyên
        alpha = img[:, :, 3]    # shape: (H, W)    — kênh trong suốt cần xử lý

        # ----------------------------------------------------------------
        # Bước 3: LÕI — Làm đục 100% tất cả pixel có màu (alpha > 0)
        # Tương đương đoạn: opaque_mask = alpha > 0 / data[:,:,3][opaque_mask] = 255
        # trong script Photoshop gốc, nhưng chạy thuần NumPy, không cần Pillow.
        # ----------------------------------------------------------------
        alpha_hardened = alpha.copy()       # sao chép để không thay đổi mảng gốc
        alpha_hardened[alpha > 0] = 255     # alpha > 0 → 255 (đục hoàn toàn)
        # Pixel alpha == 0 (hoàn toàn trong suốt) vẫn giữ nguyên = 0
        # ----------------------------------------------------------------

        # Bước 4: Ghép màu GỐC (BGR không đổi) với alpha đã làm cứng → BGRA
        b, g, r = cv2.split(bgr)            # tách từng kênh màu
        result = cv2.merge([b, g, r, alpha_hardened])   # ghép lại BGRA

    else:
        # Ảnh không có Alpha (JPEG, BMP...) → trả về nguyên không thay đổi
        result = img

    # Bước 5: Encode sang PNG (PNG mới bảo toàn được kênh Alpha khi trả về)
    _, encoded_img = cv2.imencode('.png', result)

    return Response(content=encoded_img.tobytes(), media_type="image/png")


# ══════════════════════════════════════════════════════════════════════════════
#  SMOOTH CONTOUR — Làm mượt viền & xoá viền đen thừa
# ══════════════════════════════════════════════════════════════════════════════

def _chaikin_smooth(coords: np.ndarray, refinements: int = 2) -> np.ndarray:
    """
    Thuật toán Chaikin làm mượt đường cong (mô phỏng Pen Tool trong Photoshop).
    Mỗi lần lặp, mỗi đoạn thẳng được chia thành 2 điểm Q (3/4 gốc + 1/4 kế)
    và R (1/4 gốc + 3/4 kế), tạo đường cong bo tròn tự nhiên.
    """
    for _ in range(refinements):
        new_coords = []
        num_points = len(coords)
        for i in range(num_points):
            p0 = coords[i]
            p1 = coords[(i + 1) % num_points]
            q = 0.75 * p0 + 0.25 * p1
            r = 0.25 * p0 + 0.75 * p1
            new_coords.append(q)
            new_coords.append(r)
        coords = np.array(new_coords)
    return coords.astype(np.int32)


@app.post("/process-image-smooth-contour")
async def process_image_smooth_contour(
    file: UploadFile = File(...),
    contract_pixels: int = Form(6),
    smooth_refine: int = Form(3),
    upscale_factor: int = Form(2),
):
    """
    Endpoint Làm mượt viền & xoá viền đen thừa trên ảnh PNG có nền trong suốt.
    Pipeline:
      1. Phóng to ảnh (upscale) để giảm răng cưa trước khi xử lý viền.
      2. Tìm contour lớn nhất trên kênh Alpha.
      3. Xấp xỉ polygon → Làm mượt bằng thuật toán Chaikin.
      4. Tạo mask mới từ đường cong đã làm mượt.
      5. Co viền (erode) để triệt tiêu viền đen thừa.
      6. Thu nhỏ ảnh về kích thước gốc.
    Đầu vào: ảnh PNG có nền trong suốt.
    Đầu ra: PNG 300 DPI với viền đã được làm mượt.
    """
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)

    # Đọc giữ nguyên kênh Alpha
    img_raw = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)

    if img_raw is None:
        return Response(content=b"", status_code=400)

    # Chuyển sang Pillow RGBA để xử lý chính xác (hỗ trợ tốt alpha)
    if len(img_raw.shape) == 3 and img_raw.shape[2] == 4:
        pil_img = Image.fromarray(cv2.cvtColor(img_raw, cv2.COLOR_BGRA2RGBA))
    elif len(img_raw.shape) == 3:
        pil_img = Image.fromarray(cv2.cvtColor(img_raw, cv2.COLOR_BGR2RGB)).convert("RGBA")
    else:
        # Ảnh grayscale → chuyển sang RGBA
        pil_img = Image.fromarray(img_raw).convert("RGBA")

    orig_w, orig_h = pil_img.size

    # Bước 1: Phóng to ảnh (Upscale) để giảm vỡ hạt/răng cưa
    if upscale_factor > 1:
        new_width = pil_img.width * upscale_factor
        new_height = pil_img.height * upscale_factor
        pil_img = pil_img.resize((new_width, new_height), Image.Resampling.LANCZOS)

    # Chuyển sang OpenCV BGRA
    img = np.array(pil_img)
    img = cv2.cvtColor(img, cv2.COLOR_RGBA2BGRA)

    alpha = img[:, :, 3]

    # Bước 2: Tìm contour lớn nhất
    _, thresh = cv2.threshold(alpha, 10, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if contours:
        largest_contour = max(contours, key=cv2.contourArea)

        epsilon = 0.0005 * cv2.arcLength(largest_contour, True)
        approx_polygon = cv2.approxPolyDP(largest_contour, epsilon, True)

        if len(approx_polygon) > 3:
            pts = approx_polygon.reshape(-1, 2)

            # Bước 3: Làm mượt bằng Chaikin
            smooth_pts = _chaikin_smooth(pts, refinements=smooth_refine)

            mask = np.zeros_like(alpha)
            cv2.drawContours(mask, [smooth_pts], 0, 255, thickness=cv2.FILLED)

            # Bước 4: Co viền vào trong để triệt tiêu viền đen thừa
            if contract_pixels > 0:
                actual_contract = contract_pixels * upscale_factor
                kernel_size = actual_contract * 2 + 1
                kernel = cv2.getStructuringElement(
                    cv2.MORPH_ELLIPSE, (kernel_size, kernel_size)
                )
                mask = cv2.erode(mask, kernel, iterations=1)

            img[:, :, 3] = mask

    # Bước 5: Chuyển ngược lại sang Pillow
    processed_pil = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGRA2RGBA))

    # Bước 6: Thu nhỏ về kích thước gốc nếu đã upscale
    if upscale_factor > 1:
        processed_pil = processed_pil.resize((orig_w, orig_h), Image.Resampling.LANCZOS)

    # Encode sang PNG với 300 DPI
    buf = io.BytesIO()
    processed_pil.save(buf, format="PNG", dpi=(300, 300))
    buf.seek(0)

    return Response(content=buf.getvalue(), media_type="image/png")


@app.post("/process-image-denoise")
async def process_image_denoise(file: UploadFile = File(...)):
    """
    Endpoint Làm sạch tạp âm, vân giấy, nhiễu hạt (Denoise & Deskew).
    Pipeline:
      1. Khử nhiễu hạt mờ bằng cv2.fastNlMeansDenoising (grayscale).
      2. Làm trắng nền giấy, tăng độ tương phản bằng cv2.adaptiveThreshold.
      3. Tự động bẻ thẳng (deskew) ảnh bị méo góc (scan) bằng
         cv2.getPerspectiveTransform nếu phát hiện được 4 góc rõ ràng.
         Nếu không phát hiện được tứ giác, ảnh được trả về sau bước 1-2.
    Đầu vào: ảnh bất kỳ (PNG / JPG / BGRA / BGR).
    Đầu ra: PNG 8-bit (grayscale → 3 kênh để giữ định dạng chuẩn).
    """
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)

    # ── Bước 0: Chuẩn hoá về BGR / Grayscale ──────────────────────────────
    if len(img.shape) == 3 and img.shape[2] == 4:
        # Có kênh Alpha: flatten lên nền trắng trước khi xử lý
        bgr   = img[:, :, :3].astype(np.float32)
        alpha = img[:, :, 3].astype(np.float32) / 255.0
        white = np.ones_like(bgr) * 255
        bgr_flat = (bgr * alpha[..., np.newaxis] + white * (1 - alpha[..., np.newaxis])).astype(np.uint8)
        gray = cv2.cvtColor(bgr_flat, cv2.COLOR_BGR2GRAY)
    elif len(img.shape) == 3:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        gray = img.copy()

    # ── Bước 1: Khử nhiễu hạt (Denoise) ──────────────────────────────────
    # h=10: sức mạnh lọc (tăng → mờ hơn, giảm → giữ chi tiết hơn)
    # templateWindowSize=7, searchWindowSize=21: cửa sổ tìm kiếm pixel tương đồng
    denoised = cv2.fastNlMeansDenoising(gray, h=10, templateWindowSize=7, searchWindowSize=21)

    # ── Bước 2: Làm trắng nền giấy (Adaptive Threshold) ──────────────────
    # adaptiveThreshold tự động tính ngưỡng theo vùng cục bộ → không bị ảnh hưởng
    # bởi ánh sáng không đều trên tờ giấy scan.
    # blockSize=15: kích thước vùng tính ngưỡng; C=8: hằng số hiệu chỉnh
    thresh = cv2.adaptiveThreshold(
        denoised, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        blockSize=15, C=8
    )

    # ── Bước 3: Tự động bẻ thẳng (Deskew / Perspective Correction) ───────
    result = _deskew(thresh)

    # ── Bước 4: Encode sang PNG và trả về ────────────────────────────────
    # Chuyển về BGR 3 kênh để đảm bảo tương thích với các viewer
    result_bgr = cv2.cvtColor(result, cv2.COLOR_GRAY2BGR)
    _, encoded_img = cv2.imencode('.png', result_bgr)
    return Response(content=encoded_img.tobytes(), media_type="image/png")


def _deskew(gray: np.ndarray) -> np.ndarray:
    """
    Tự động phát hiện tứ giác lớn nhất trong ảnh (thường là tờ giấy / tài liệu)
    và áp dụng cv2.getPerspectiveTransform để bẻ thẳng phối cảnh.
    Trả về ảnh gốc không thay đổi nếu không tìm thấy tứ giác phù hợp.
    """
    h, w = gray.shape[:2]

    # Tìm cạnh (Canny) để lấy đường viền tài liệu
    edges = cv2.Canny(gray, 30, 80)
    edges = cv2.dilate(edges, np.ones((3, 3), np.uint8), iterations=1)

    contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return gray

    # Sắp xếp theo diện tích giảm dần, chỉ xét các contour lớn
    contours = sorted(contours, key=cv2.contourArea, reverse=True)
    doc_contour = None
    for cnt in contours[:10]:
        peri = cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)
        # Chỉ nhận tứ giác (4 đỉnh) chiếm ít nhất 20% diện tích ảnh
        if len(approx) == 4 and cv2.contourArea(approx) > 0.20 * h * w:
            doc_contour = approx
            break

    if doc_contour is None:
        return gray  # Không phát hiện tứ giác rõ ràng → giữ nguyên

    # Sắp xếp 4 điểm theo thứ tự: top-left, top-right, bottom-right, bottom-left
    pts = doc_contour.reshape(4, 2).astype(np.float32)
    rect = _order_points(pts)
    tl, tr, br, bl = rect

    # Tính kích thước ảnh đầu ra
    width_top    = np.linalg.norm(tr - tl)
    width_bottom = np.linalg.norm(br - bl)
    dst_w = int(max(width_top, width_bottom))

    height_left  = np.linalg.norm(bl - tl)
    height_right = np.linalg.norm(br - tr)
    dst_h = int(max(height_left, height_right))

    if dst_w < 10 or dst_h < 10:
        return gray

    dst = np.array([
        [0,       0      ],
        [dst_w-1, 0      ],
        [dst_w-1, dst_h-1],
        [0,       dst_h-1],
    ], dtype=np.float32)

    M = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(gray, M, (dst_w, dst_h),
                                 flags=cv2.INTER_LINEAR,
                                 borderMode=cv2.BORDER_CONSTANT,
                                 borderValue=255)
    return warped


def _order_points(pts: np.ndarray) -> np.ndarray:
    """
    Sắp xếp 4 điểm theo thứ tự: top-left, top-right, bottom-right, bottom-left.
    """
    rect = np.zeros((4, 2), dtype=np.float32)
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]   # top-left: tổng nhỏ nhất
    rect[2] = pts[np.argmax(s)]   # bottom-right: tổng lớn nhất
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]  # top-right: hiệu nhỏ nhất
    rect[3] = pts[np.argmax(diff)]  # bottom-left: hiệu lớn nhất
    return rect


# ══════════════════════════════════════════════════════════════════════════════
#  BATCH PROCESSING
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/process-batch")
async def process_batch(
    files: List[UploadFile] = File(...),
    # ── Resize ──────────────────────────────────────────────────────────────
    resize_enabled: bool    = Form(False),
    resize_width:   int     = Form(0),   # 0 = tự tính theo tỉ lệ
    resize_height:  int     = Form(0),   # 0 = tự tính theo tỉ lệ
    # ── Crop ────────────────────────────────────────────────────────────────
    crop_enabled:   bool    = Form(False),
    crop_ratio_w:   int     = Form(1),   # tỉ lệ chiều rộng (vd: 16)
    crop_ratio_h:   int     = Form(1),   # tỉ lệ chiều cao  (vd: 9)
    # ── Watermark ───────────────────────────────────────────────────────────
    wm_enabled:     bool    = Form(False),
    wm_text:        str     = Form("© RenGoFun"),
    wm_opacity:     float   = Form(0.35),  # 0.0–1.0
    wm_position:    str     = Form("bottom-right"),  # top-left/top-right/bottom-left/bottom-right/center
    wm_font_scale:  float   = Form(1.0),
    # ── Output format ───────────────────────────────────────────────────────
    output_format:  str     = Form("png"),  # png | jpg | webp
):
    """
    Xử lý hàng loạt nhiều ảnh với pipeline:
      1. Resize   — thay đổi kích thước giữ tỉ lệ
      2. Crop     — cắt tâm theo tỉ lệ chỉ định
      3. Watermark — đóng dấu text bằng alpha-blend cv2
      4. Đổi đuôi — encode sang PNG / JPG / WEBP
    Trả về: file ZIP chứa toàn bộ ảnh đã xử lý.
    """
    fmt_map = {"png": ".png", "jpg": ".jpg", "jpeg": ".jpg", "webp": ".webp"}
    ext = fmt_map.get(output_format.lower(), ".png")

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        for upload in files:
            contents = await upload.read()
            nparr = np.frombuffer(contents, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)
            if img is None:
                continue  # bỏ qua file hỏng

            # ── 1. Resize ──────────────────────────────────────────────────
            if resize_enabled and (resize_width > 0 or resize_height > 0):
                img = _batch_resize(img, resize_width, resize_height)

            # ── 2. Crop ────────────────────────────────────────────────────
            if crop_enabled and crop_ratio_w > 0 and crop_ratio_h > 0:
                img = _batch_crop(img, crop_ratio_w, crop_ratio_h)

            # ── 3. Watermark ───────────────────────────────────────────────
            if wm_enabled and wm_text.strip():
                img = _batch_watermark(img, wm_text, wm_opacity, wm_position, wm_font_scale)

            # ── 4. Encode & đưa vào ZIP ────────────────────────────────────
            encode_params: list = []
            if ext == ".jpg":
                encode_params = [cv2.IMWRITE_JPEG_QUALITY, 92]
                # JPG không hỗ trợ Alpha — flatten xuống nền trắng
                img = _flatten_alpha(img)
            elif ext == ".webp":
                encode_params = [cv2.IMWRITE_WEBP_QUALITY, 90]
                img = _flatten_alpha(img)

            ok, buf = cv2.imencode(ext, img, encode_params)
            if not ok:
                continue

            # Đặt tên file trong ZIP: <tên gốc không đuôi><ext mới>
            base = upload.filename.rsplit(".", 1)[0] if "." in upload.filename else upload.filename
            zf.writestr(f"{base}{ext}", buf.tobytes())

    zip_buffer.seek(0)
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=batch_output.zip"},
    )


# ── Batch helper functions ─────────────────────────────────────────────────

def _batch_resize(img: np.ndarray, max_w: int, max_h: int) -> np.ndarray:
    """Resize giữ tỉ lệ khung hình theo giới hạn max_w × max_h."""
    h, w = img.shape[:2]
    if max_w <= 0:
        scale = max_h / h
    elif max_h <= 0:
        scale = max_w / w
    else:
        scale = min(max_w / w, max_h / h)
    if scale >= 1.0:
        return img  # không phóng to
    new_w = max(1, int(w * scale))
    new_h = max(1, int(h * scale))
    return cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)


def _batch_crop(img: np.ndarray, ratio_w: int, ratio_h: int) -> np.ndarray:
    """Crop tâm ảnh theo tỉ lệ ratio_w:ratio_h."""
    h, w = img.shape[:2]
    target_ratio = ratio_w / ratio_h
    current_ratio = w / h
    if current_ratio > target_ratio:
        # Ảnh rộng hơn → cắt hai bên trái/phải
        new_w = int(h * target_ratio)
        x_off = (w - new_w) // 2
        return img[:, x_off: x_off + new_w]
    elif current_ratio < target_ratio:
        # Ảnh cao hơn → cắt trên/dưới
        new_h = int(w / target_ratio)
        y_off = (h - new_h) // 2
        return img[y_off: y_off + new_h, :]
    return img


def _batch_watermark(
    img: np.ndarray,
    text: str,
    opacity: float,
    position: str,
    font_scale: float,
) -> np.ndarray:
    """
    Đóng dấu text lên ảnh bằng alpha-blend (overlay ma trận):
      - Vẽ text lên layer riêng (overlay) với màu trắng + shadow đen
      - Blend overlay vào ảnh gốc theo hệ số opacity
    Hỗ trợ cả ảnh BGRA (4 kênh) và BGR (3 kênh).
    """
    has_alpha = (len(img.shape) == 3 and img.shape[2] == 4)
    # Làm việc trên bản sao BGR để vẽ, rồi ghép lại kênh Alpha
    if has_alpha:
        bgr  = img[:, :, :3].copy()
        alpha_ch = img[:, :, 3]
    else:
        bgr = img.copy()

    h, w = bgr.shape[:2]
    font      = cv2.FONT_HERSHEY_DUPLEX
    thickness = max(1, int(font_scale * 1.5))
    (tw, th), baseline = cv2.getTextSize(text, font, font_scale, thickness)

    # Tính toạ độ góc dưới-trái của chữ theo position
    margin = max(12, int(min(h, w) * 0.02))
    pos_map = {
        "top-left":     (margin, margin + th),
        "top-right":    (w - tw - margin, margin + th),
        "bottom-left":  (margin, h - margin - baseline),
        "bottom-right": (w - tw - margin, h - margin - baseline),
        "center":       ((w - tw) // 2, (h + th) // 2),
    }
    x, y = pos_map.get(position, pos_map["bottom-right"])
    x = max(0, min(x, w - tw))
    y = max(th, min(y, h - baseline))

    # Tạo overlay layer trong suốt
    overlay = bgr.copy()
    # Shadow đen (lệch 2px)
    cv2.putText(overlay, text, (x + 2, y + 2), font, font_scale, (0, 0, 0), thickness + 1, cv2.LINE_AA)
    # Chữ trắng
    cv2.putText(overlay, text, (x, y), font, font_scale, (255, 255, 255), thickness, cv2.LINE_AA)

    # Alpha-blend: result = bgr * (1 - opacity) + overlay * opacity
    blended = cv2.addWeighted(bgr, 1 - opacity, overlay, opacity, 0)

    if has_alpha:
        b, g, r = cv2.split(blended)
        return cv2.merge([b, g, r, alpha_ch])
    return blended


def _flatten_alpha(img: np.ndarray) -> np.ndarray:
    """Flatten kênh Alpha lên nền trắng để chuẩn bị encode JPG/WEBP."""
    if len(img.shape) == 3 and img.shape[2] == 4:
        bgr   = img[:, :, :3].astype(np.float32)
        alpha = img[:, :, 3].astype(np.float32) / 255.0
        white = np.ones_like(bgr) * 255
        return (bgr * alpha[..., np.newaxis] + white * (1 - alpha[..., np.newaxis])).astype(np.uint8)
    return img


# ══════════════════════════════════════════════════════════════════════════════
#  BLUR DETECTION  — Laplacian Variance Method
# ══════════════════════════════════════════════════════════════════════════════

def _laplacian_score(img: np.ndarray) -> float:
    """
    Tính điểm độ nét bằng phương sai Laplacian.
    - Ảnh nét  → đường cạnh rõ, phương sai cao → score cao
    - Ảnh mờ  → đường cạnh mờ, phương sai thấp → score thấp
    Công thức: Var(Laplacian(grayscale(img)))
    """
    if len(img.shape) == 3:
        if img.shape[2] == 4:
            # Flatten alpha → nền trắng trước khi chuyển xám
            bgr   = img[:, :, :3].astype(np.float32)
            alpha = img[:, :, 3].astype(np.float32) / 255.0
            white = np.ones_like(bgr) * 255
            bgr_flat = (bgr * alpha[..., np.newaxis] + white * (1 - alpha[..., np.newaxis])).astype(np.uint8)
            gray = cv2.cvtColor(bgr_flat, cv2.COLOR_BGR2GRAY)
        else:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        gray = img

    lap = cv2.Laplacian(gray, cv2.CV_64F)
    return float(lap.var())


@app.post("/check-blur")
async def check_blur(
    file: UploadFile = File(...),
    threshold: float = Form(100.0),
):
    """
    Kiểm tra độ nét của MỘT ảnh bằng phương sai Laplacian.
    Trả về JSON:
      { filename, score, threshold, blurry }
    blurry = true nếu score < threshold.
    """
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img   = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)

    if img is None:
        return JSONResponse(status_code=400, content={"error": "Không đọc được ảnh"})

    score = _laplacian_score(img)
    return JSONResponse({
        "filename":  file.filename,
        "score":     round(score, 2),
        "threshold": threshold,
        "blurry":    score < threshold,
    })


@app.post("/check-blur-batch")
async def check_blur_batch(
    files:     List[UploadFile] = File(...),
    threshold: float            = Form(100.0),
):
    """
    Kiểm tra độ nét hàng loạt nhiều ảnh.
    Trả về JSON array, mỗi phần tử:
      { filename, score, threshold, blurry }
    Thứ tự kết quả khớp với thứ tự files gửi lên.
    """
    results = []
    for upload in files:
        contents = await upload.read()
        nparr = np.frombuffer(contents, np.uint8)
        img   = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)

        if img is None:
            results.append({
                "filename":  upload.filename,
                "score":     0.0,
                "threshold": threshold,
                "blurry":    True,
                "error":     "Không đọc được ảnh",
            })
            continue

        score = _laplacian_score(img)
        results.append({
            "filename":  upload.filename,
            "score":     round(score, 2),
            "threshold": threshold,
            "blurry":    score < threshold,
        })

    return JSONResponse(results)
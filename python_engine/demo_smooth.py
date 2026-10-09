import cv2
import numpy as np
import os

def create_jagged_image(size=400):
    """Tạo một ảnh PNG (có Alpha) với viền bị răng cưa nặng để test."""
    img = np.zeros((size, size, 4), dtype=np.uint8)
    
    # Tạo răng cưa bằng cách vẽ không dùng anti-aliasing (cv2.LINE_4 hoặc cv2.LINE_8)
    points = np.array([
        [200, 50], [300, 150], [250, 350], [150, 350], [100, 150]
    ])
    
    # Vẽ đa giác đục (Alpha = 255)
    cv2.fillPoly(img, [points], (255, 100, 100, 255), lineType=cv2.LINE_4)
    
    # Làm méo thêm để tạo răng cưa
    M = cv2.getRotationMatrix2D((size//2, size//2), 15, 1.0)
    img = cv2.warpAffine(img, M, (size, size), flags=cv2.INTER_NEAREST)
    return img

def method_1_sdf(img):
    """
    Phương pháp 1: Signed Distance Field (SDF)
    Tạo độ mềm (anti-aliasing) toán học bằng cách tính khoảng cách từ mỗi pixel tới viền.
    """
    result = img.copy()
    alpha = result[:, :, 3]
    
    # Tạo mask nhị phân
    _, binary = cv2.threshold(alpha, 127, 255, cv2.THRESH_BINARY)
    
    # Tính distance transform cho phần bên trong (foreground)
    dist_in = cv2.distanceTransform(binary, cv2.DIST_L2, 3)
    
    # Tính distance transform cho phần bên ngoài (background)
    dist_out = cv2.distanceTransform(cv2.bitwise_not(binary), cv2.DIST_L2, 3)
    
    # Kết hợp thành Signed Distance
    # Giá trị > 0 là bên trong, < 0 là bên ngoài
    sdf = dist_in - dist_out
    
    # Chuyển SDF thành kênh alpha mềm (Soft Alpha)
    # Quy đổi khoảng cách [-radius, radius] thành [0, 255]
    radius = 2.0  # Độ mờ của viền (pixel)
    soft_alpha = np.clip((sdf + radius) / (2 * radius), 0, 1) * 255
    
    result[:, :, 3] = soft_alpha.astype(np.uint8)
    return result

def method_2_resample_gauss(img):
    """
    Phương pháp 2: Resampling + Lọc Gauss 1D
    Lấy danh sách điểm trên contour, lọc Gauss 1D trên toạ độ X và Y để làm mượt, sau đó vẽ lại.
    """
    result = img.copy()
    alpha = result[:, :, 3]
    
    # Tạo mask nhị phân
    _, binary = cv2.threshold(alpha, 127, 255, cv2.THRESH_BINARY)
    
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    if not contours:
        return result
        
    largest_contour = max(contours, key=cv2.contourArea)
    pts = largest_contour.reshape(-1, 2).astype(np.float32)
    
    # 1. Resample (nội suy điểm đều nhau)
    # Lấy thêm điểm để Contour dày đặc
    # Để đơn giản demo, ta lọc Gauss trực tiếp trên các điểm hiện có
    
    # 2. Lọc Gauss 1D trên mảng toạ độ
    window_size = 15 # Cửa sổ mượt
    
    # Pad mảng để lọc dạng vòng tròn (closed contour)
    pts_padded = np.pad(pts, ((window_size, window_size), (0, 0)), mode='wrap')
    
    # Áp dụng Gaussian Blur 1D trên tọa độ X và Y
    smoothed_pts = cv2.GaussianBlur(pts_padded, (1, window_size), 0)
    
    # Lấy lại phần lõi
    smoothed_pts = smoothed_pts[window_size:-window_size]
    smoothed_pts = np.round(smoothed_pts).astype(np.int32)
    
    # Vẽ lại mask
    new_mask = np.zeros_like(alpha)
    cv2.drawContours(new_mask, [smoothed_pts], 0, 255, cv2.FILLED, cv2.LINE_AA)
    
    result[:, :, 3] = new_mask
    return result

def method_3_guided_filter(img):
    """
    Phương pháp 3: Guided Filter
    Dùng chính ảnh gốc hoặc mask mờ làm Guide để lọc Alpha. Giữ lại được viền sắc nét 
    ở các góc cạnh (edge-preserving) nhưng làm mịn vùng nhiễu (răng cưa).
    *Yêu cầu opencv-contrib-python (cv2.ximgproc)
    """
    result = img.copy()
    alpha = result[:, :, 3]
    bgr = result[:, :, :3]
    
    # Tạo mask nhị phân
    _, binary = cv2.threshold(alpha, 127, 255, cv2.THRESH_BINARY)
    
    # Guided filter (nếu có opencv-contrib-python)
    try:
        # Guide = ảnh BGR chuyển xám, Source = binary mask
        guide = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
        
        # Bán kính (radius) và eps (regularization)
        radius = 8
        eps = 100.0 
        
        soft_alpha = cv2.ximgproc.guidedFilter(
            guide=guide, 
            src=binary, 
            radius=radius, 
            eps=eps, 
            dDepth=-1
        )
        result[:, :, 3] = soft_alpha
    except AttributeError:
        print("Không tìm thấy cv2.ximgproc. Sử dụng Bilateral Filter thay thế.")
        # Nếu không có ximgproc, demo bằng Bilateral filter (Cũng là edge-preserving)
        soft_alpha = cv2.bilateralFilter(binary, d=9, sigmaColor=75, sigmaSpace=75)
        # Làm mềm thêm một chút bằng Gaussian
        soft_alpha = cv2.GaussianBlur(soft_alpha, (3, 3), 0)
        result[:, :, 3] = soft_alpha

    return result

if __name__ == "__main__":
    import sys
    out_dir = "demo_smoothing_output"
    os.makedirs(out_dir, exist_ok=True)
    
    # 1. Tạo ảnh gốc hoặc đọc ảnh từ file
    if len(sys.argv) > 1:
        img_path = sys.argv[1]
        print(f"Đang đọc ảnh từ: {img_path}...")
        raw_img = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)
        if raw_img is None:
            print(f"Lỗi: Không thể đọc được ảnh tại '{img_path}'. Hãy kiểm tra lại đường dẫn.")
            sys.exit(1)
        if len(raw_img.shape) < 3 or raw_img.shape[2] != 4:
            print("Lỗi: Ảnh phải có định dạng PNG và chứa kênh trong suốt (Alpha channel).")
            sys.exit(1)
    else:
        print("Đang tạo ảnh gốc tự động...")
        raw_img = create_jagged_image()

    cv2.imwrite(f"{out_dir}/0_original_jagged.png", raw_img)
    
    # 2. Xử lý Phương pháp 1 (SDF)
    print("Đang xử lý PP1 (SDF)...")
    sdf_img = method_1_sdf(raw_img)
    cv2.imwrite(f"{out_dir}/1_method_sdf.png", sdf_img)
    
    # 3. Xử lý Phương pháp 2 (Resample + Gauss 1D)
    print("Đang xử lý PP2 (Resample + Gauss)...")
    gauss1d_img = method_2_resample_gauss(raw_img)
    cv2.imwrite(f"{out_dir}/2_method_gauss1d.png", gauss1d_img)
    
    # 4. Xử lý Phương pháp 3 (Guided Filter)
    print("Đang xử lý PP3 (Guided Filter)...")
    guided_img = method_3_guided_filter(raw_img)
    cv2.imwrite(f"{out_dir}/3_method_guided.png", guided_img)
    
    print(f"Hoàn thành! Bạn hãy mở thư mục '{out_dir}' để xem so sánh trực quan.")

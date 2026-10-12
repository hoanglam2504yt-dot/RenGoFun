import { useState, useEffect } from "react";
import { Download, CheckCircle2, X, FileImage } from "lucide-react";
import "../styles/toast.css";

/**
 * Event helper để kích hoạt thông báo tải ảnh từ bất kỳ đâu trong app:
 * triggerDownloadToast({ fileName: "my_image.png", message: "Đã tải file PNG...", title: "Tải ảnh thành công" })
 */
export function triggerDownloadToast(detail = {}) {
  const event = new CustomEvent("rengofun:download-toast", {
    detail: {
      id: Date.now() + Math.random(),
      title: detail.title || "Tải ảnh thành công",
      message: detail.message || "Đã lưu tệp hình ảnh vào thư mục máy tính",
      fileName: detail.fileName || "RenGoFun_Export.png",
      tag: detail.tag || "300 DPI Lossless",
    },
  });
  window.dispatchEvent(event);
}

export default function DownloadToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToastEvent = (e) => {
      const newToast = { ...e.detail, isExiting: false };

      setToasts((prev) => [...prev.slice(-3), newToast]); // Giữ tối đa 4 thông báo mới nhất

      // Bắt đầu fade out sau 2.5 giây
      const exitTimer = setTimeout(() => {
        setToasts((prev) =>
          prev.map((t) => (t.id === newToast.id ? { ...t, isExiting: true } : t))
        );
      }, 2500);

      // Xóa hoàn toàn sau 3.0 giây
      const removeTimer = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 3000);

      return () => {
        clearTimeout(exitTimer);
        clearTimeout(removeTimer);
      };
    };

    window.addEventListener("rengofun:download-toast", handleToastEvent);
    return () => {
      window.removeEventListener("rengofun:download-toast", handleToastEvent);
    };
  }, []);

  const handleDismiss = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="download-toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`download-toast-card ${toast.isExiting ? "toast-exit" : "toast-enter"}`}
        >
          {/* Icon tròn xanh lá nổi bật */}
          <div className="download-toast-icon-wrapper">
            <CheckCircle2 size={18} className="download-toast-icon" />
          </div>

          {/* Nội dung thông báo */}
          <div className="download-toast-body">
            <div className="download-toast-header">
              <span className="download-toast-title">{toast.title}</span>
              <span className="download-toast-tag">{toast.tag}</span>
            </div>

            <div className="download-toast-filename">
              <FileImage size={12} style={{ flexShrink: 0, opacity: 0.8 }} />
              <span className="download-toast-filename-text" title={toast.fileName}>
                {toast.fileName}
              </span>
            </div>

            <div className="download-toast-msg">{toast.message}</div>
          </div>

          {/* Nút đóng */}
          <button
            className="download-toast-close"
            onClick={() => handleDismiss(toast.id)}
            title="Đóng thông báo"
          >
            <X size={14} />
          </button>

          {/* Thanh chạy tiến độ 3 giây */}
          <div className="download-toast-timer-bar" />
        </div>
      ))}
    </div>
  );
}

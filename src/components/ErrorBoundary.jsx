import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("RenGoFun ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.href = "/";
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          minHeight: "400px",
          padding: "32px",
          textAlign: "center",
          fontFamily: "var(--font-ui, system-ui, sans-serif)",
          color: "var(--text-primary, #1e293b)"
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
            color: "#ef4444"
          }}>
            <AlertTriangle size={28} />
          </div>

          <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: "0 0 8px 0" }}>
            Đã xảy ra sự cố hiển thị
          </h2>
          <p style={{
            fontSize: "0.82rem",
            color: "var(--text-secondary, #64748b)",
            maxWidth: 460,
            margin: "0 0 16px 0",
            lineHeight: 1.5
          }}>
            Hệ thống đã tự động ngăn chặn màn hình trắng. Bạn có thể bấm làm mới hoặc quay lại trang chủ.
          </p>

          {this.state.error && (
            <div style={{
              background: "rgba(0, 0, 0, 0.05)",
              border: "1px solid var(--border, #e2e8f0)",
              borderRadius: 8,
              padding: "8px 14px",
              fontFamily: "monospace",
              fontSize: "0.72rem",
              color: "#ef4444",
              marginBottom: 20,
              maxWidth: "500px",
              wordBreak: "break-word"
            }}>
              {this.state.error.message || String(this.state.error)}
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={this.handleReload}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 8,
                background: "var(--card-bg, #ffffff)",
                border: "1px solid var(--border, #cbd5e1)",
                color: "var(--text-primary, #334155)",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              <RefreshCw size={13} />
              <span>Tải lại</span>
            </button>

            <button
              onClick={this.handleGoHome}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 8,
                background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                border: "none",
                color: "#ffffff",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)"
              }}
            >
              <Home size={13} />
              <span>Về Trang Chủ</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

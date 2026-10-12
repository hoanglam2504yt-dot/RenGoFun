import { useState, useEffect } from "react";
import MainLayout from "./layouts/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import EditorPage from "./pages/EditorPage";
import BatchProcessPage from "./pages/BatchProcessPage";
import SettingsPage from "./pages/SettingsPage";
import AdminDashboard from "./pages/AdminDashboard";
import AuthModal from "./components/AuthModal";
import { authService } from "./services/authService";
import { initSettingsFromStorage } from "./hooks/useSettings";

import DownloadToastContainer from "./components/DownloadToast";
import ErrorBoundary from "./components/ErrorBoundary";

// ── View → Component map ──────────────────────────────────────────────────────
function resolveView(view, navigate, user, onLogout) {
  // ── Protected Admin Route ──────────────────────────────────────────────────
  if (view === "admin") {
    if (!user || user.role !== "admin") {
      setTimeout(() => navigate("dashboard"), 0);
      return (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          height: "100%", flexDirection: "column", gap: 12,
        }}>
          <span style={{ fontSize: "2.5rem" }}>🚫</span>
          <div style={{ fontSize: "0.9rem", color: "#ef4444", fontWeight: 700 }}>Không đủ thẩm quyền</div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>Khu vực này chỉ dành cho Quản trị viên.</div>
        </div>
      );
    }
    return <AdminDashboard user={user} />;
  }

  switch (view) {
    case "editor":
      return <EditorPage />;
    case "queue":
    case "batch":
      return <BatchProcessPage onNavigate={navigate} user={user} />;
    case "settings":
      return <SettingsPage user={user} onLogout={onLogout} />;
    case "dashboard":
    default:
      return <DashboardPage onNavigate={navigate} user={user} />;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
function App() {
  // Auth state
  const [user, setUser] = useState(null);

  // Khôi phục theme và phiên đăng nhập từ localStorage khi app khởi động
  useEffect(() => {
    // 1. Khôi phục theme/colorMode đã lưu ngay lập tức
    initSettingsFromStorage();

    // 2. Khôi phục user session
    const token = authService.getToken();
    const storedUser = localStorage.getItem("rengofun_user");
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (_) {
        setUser(null);
      }
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  // State-based routing — không cần react-router-dom
  const [currentView, setCurrentView] = useState("dashboard");

  const handleNavigate = (viewId) => {
    setCurrentView(viewId);
  };

  // Chưa đăng nhập → hiện AuthModal
  if (!user) {
    return <AuthModal onLoginSuccess={handleLoginSuccess} />;
  }

  // Đã đăng nhập → hiện toàn bộ app + DownloadToastContainer toàn cục
  return (
    <>
      <MainLayout
        currentView={currentView}
        onNavigate={handleNavigate}
        user={user}
        onLogout={handleLogout}
      >
        <ErrorBoundary onReset={() => setCurrentView("dashboard")}>
          {resolveView(currentView, handleNavigate, user, handleLogout)}
        </ErrorBoundary>
      </MainLayout>
      <DownloadToastContainer />
    </>
  );
}

export default App;
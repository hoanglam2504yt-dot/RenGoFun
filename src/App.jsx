import { useState, useEffect } from "react";
import MainLayout from "./layouts/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import EditorPage from "./pages/EditorPage";
import SettingsPage from "./pages/SettingsPage";
import AuthModal from "./components/AuthModal";
import { authService } from "./services/authService";
import { initSettingsFromStorage } from "./hooks/useSettings";

// ── View → Component map ──────────────────────────────────────────────────────
function resolveView(view, navigate, user, onLogout) {
  switch (view) {
    case "editor":
      return <EditorPage />;
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

  // Đã đăng nhập → hiện toàn bộ app
  return (
    <MainLayout
      currentView={currentView}
      onNavigate={handleNavigate}
      user={user}
      onLogout={handleLogout}
    >
      {resolveView(currentView, handleNavigate, user, handleLogout)}
    </MainLayout>
  );
}

export default App;
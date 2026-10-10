import { useState, useEffect } from "react";
import MainLayout from "./layouts/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import EditorPage from "./pages/EditorPage";
import SettingsPage from "./pages/SettingsPage";
import AuthModal from "./components/AuthModal";
import { authService } from "./services/authService";

// ── View → Component map ──────────────────────────────────────────────────────
// Thêm view mới vào đây khi build thêm trang
function resolveView(view, navigate) {
  switch (view) {
    case "editor":
      return <EditorPage />;
    case "settings":
      return <SettingsPage />;
    case "dashboard":
    default:
      return <DashboardPage onNavigate={navigate} />;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
function App() {
  // Auth state
  const [user, setUser] = useState(null);

  // Khôi phục phiên đăng nhập từ localStorage khi app khởi động
  useEffect(() => {
    const token = authService.getToken();
    const storedUser = localStorage.getItem("rengofun_user");
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
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
      {resolveView(currentView, handleNavigate)}
    </MainLayout>
  );
}

export default App;
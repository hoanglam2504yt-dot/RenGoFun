import { useState } from "react";
import MainLayout from "./layouts/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import EditorPage from "./pages/EditorPage";

// ── View → Component map ──────────────────────────────────────────────────────
// Thêm view mới vào đây khi build thêm trang
function resolveView(view, navigate) {
  switch (view) {
    case "editor":
      return <EditorPage />;
    case "dashboard":
    default:
      return <DashboardPage onNavigate={navigate} />;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
function App() {
  // State-based routing — không cần react-router-dom
  const [currentView, setCurrentView] = useState("dashboard");

  const handleNavigate = (viewId) => {
    setCurrentView(viewId);
  };

  return (
    <MainLayout currentView={currentView} onNavigate={handleNavigate}>
      {resolveView(currentView, handleNavigate)}
    </MainLayout>
  );
}

export default App;
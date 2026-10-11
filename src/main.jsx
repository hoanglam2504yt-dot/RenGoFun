import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { initSettingsFromStorage } from "./hooks/useSettings";

// Khởi tạo và áp dụng theme/settings ngay lập tức khi load app
initSettingsFromStorage();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

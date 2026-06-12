import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./App.css";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider } from "./context/AuthContext";
import { TaskProvider } from "./context/TaskContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <TaskProvider>
            <App />
          </TaskProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>
);
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./App.css";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider } from "./context/AuthContext";
import { ApiHealthProvider } from "./context/ApiHealthContext";
import { SocketProvider } from "./context/SocketContext";
import { WorkspaceProvider } from "./context/WorkspaceContext";
import { NotificationProvider } from "./context/NotificationContext";
import { TaskProvider } from "./context/TaskContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <ApiHealthProvider>
          <SocketProvider>
            <WorkspaceProvider>
              <NotificationProvider>
                <TaskProvider>
                  <App />
                </TaskProvider>
              </NotificationProvider>
            </WorkspaceProvider>
          </SocketProvider>
          </ApiHealthProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>
);

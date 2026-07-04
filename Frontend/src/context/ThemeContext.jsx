import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const ThemeContext = createContext();

export const ACCENT_PRESETS = {
  indigo: { label: "Indigo", color: "#6366f1", hover: "#4f46e5" },
  violet: { label: "Violet", color: "#8b5cf6", hover: "#7c3aed" },
  blue: { label: "Blue", color: "#3b82f6", hover: "#2563eb" },
  emerald: { label: "Emerald", color: "#10b981", hover: "#059669" },
  rose: { label: "Rose", color: "#f43f5e", hover: "#e11d48" },
  amber: { label: "Amber", color: "#f59e0b", hover: "#d97706" },
};

const getSystemTheme = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const hexToRgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeModeState] = useState(() => {
    const saved = localStorage.getItem("taskflow-theme-mode");
    if (saved === "light" || saved === "dark" || saved === "system") return saved;
    const legacy = localStorage.getItem("taskflow-theme");
    if (legacy === "light" || legacy === "dark") return legacy;
    return "system";
  });

  const [accentKey, setAccentKeyState] = useState(() => {
    const saved = localStorage.getItem("taskflow-accent");
    return saved && ACCENT_PRESETS[saved] ? saved : "indigo";
  });

  const [resolvedTheme, setResolvedTheme] = useState(() => {
    const mode = localStorage.getItem("taskflow-theme-mode") || "system";
    if (mode === "light" || mode === "dark") return mode;
    return getSystemTheme();
  });

  const applyAccent = useCallback((key) => {
    const preset = ACCENT_PRESETS[key] || ACCENT_PRESETS.indigo;
    const root = document.documentElement;
    root.style.setProperty("--accent", preset.color);
    root.style.setProperty("--accent-hover", preset.hover);
    root.style.setProperty("--accent-light", hexToRgba(preset.color, 0.15));
    root.style.setProperty("--accent-glow", hexToRgba(preset.color, 0.25));
  }, []);

  useEffect(() => {
    const resolved = themeMode === "system" ? getSystemTheme() : themeMode;
    setResolvedTheme(resolved);
    document.documentElement.setAttribute("data-theme", resolved);
    localStorage.setItem("taskflow-theme-mode", themeMode);
    localStorage.setItem("taskflow-theme", resolved);
  }, [themeMode]);

  useEffect(() => {
    applyAccent(accentKey);
    localStorage.setItem("taskflow-accent", accentKey);
  }, [accentKey, applyAccent]);

  useEffect(() => {
    if (themeMode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const resolved = getSystemTheme();
      setResolvedTheme(resolved);
      document.documentElement.setAttribute("data-theme", resolved);
      localStorage.setItem("taskflow-theme", resolved);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [themeMode]);

  const setThemeMode = (mode) => {
    if (mode === "light" || mode === "dark" || mode === "system") {
      setThemeModeState(mode);
    }
  };

  const setAccent = (key) => {
    if (ACCENT_PRESETS[key]) setAccentKeyState(key);
  };

  const toggleTheme = () => {
    setThemeModeState((prev) => {
      const current = prev === "system" ? getSystemTheme() : prev;
      return current === "light" ? "dark" : "light";
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: resolvedTheme,
        themeMode,
        resolvedTheme,
        accentKey,
        setThemeMode,
        setAccent,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

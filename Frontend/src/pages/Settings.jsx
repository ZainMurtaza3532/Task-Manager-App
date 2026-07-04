import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme, ACCENT_PRESETS } from "../context/ThemeContext";
import { User, Lock, Palette, Save, Sun, Moon, Monitor } from "lucide-react";
import { useToast } from "../context/ToastContext";

const THEME_OPTIONS = [
  { id: "light", label: "Light", icon: Sun, desc: "Bright and clean" },
  { id: "dark", label: "Dark", icon: Moon, desc: "Easy on the eyes" },
  { id: "system", label: "System", icon: Monitor, desc: "Match your device" },
];

const Settings = () => {
  const { user, updateProfile, updatePassword } = useAuth();
  const { themeMode, resolvedTheme, accentKey, setThemeMode, setAccent } = useTheme();
  const { addToast } = useToast();

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isProfileUpdating, setIsProfileUpdating] = useState(false);
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsProfileUpdating(true);
    await updateProfile(profileData);
    setIsProfileUpdating(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return addToast("New passwords do not match", "error");
    }
    if (passwordData.newPassword.length < 6) {
      return addToast("Password must be at least 6 characters long", "error");
    }

    setIsPasswordUpdating(true);
    const success = await updatePassword({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });

    if (success) {
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    }
    setIsPasswordUpdating(false);
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "appearance", label: "Appearance", icon: Palette },
  ];

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account, security, and appearance preferences.</p>
        </div>
      </div>

      <div className="settings-layout">
        <nav className="settings-tabs">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`settings-tab ${activeTab === id ? "active" : ""}`}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        <div className="settings-content">
          {activeTab === "profile" && (
            <div className="card settings-card">
              <h2 className="settings-card-title">
                <User size={20} /> Profile Information
              </h2>
              <form onSubmit={handleProfileSubmit}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    className="form-input"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    className="form-input"
                    placeholder="Enter your email address"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={isProfileUpdating}>
                  <Save size={18} />
                  {isProfileUpdating ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </div>
          )}

          {activeTab === "security" && (
            <div className="card settings-card">
              <h2 className="settings-card-title">
                <Lock size={20} /> Change Password
              </h2>
              <form onSubmit={handlePasswordSubmit}>
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="form-input"
                    placeholder="Enter current password"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="form-input"
                    placeholder="Enter new password"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="form-input"
                    placeholder="Confirm new password"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={isPasswordUpdating}>
                  <Lock size={18} />
                  {isPasswordUpdating ? "Updating..." : "Update Password"}
                </button>
              </form>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="settings-appearance">
              <div className="card settings-card">
                <h2 className="settings-card-title">
                  <Palette size={20} /> Theme Mode
                </h2>
                <p className="settings-card-desc">
                  Choose how TaskFlow looks. System mode follows your device settings.
                </p>
                <div className="theme-mode-grid">
                  {THEME_OPTIONS.map(({ id, label, icon: Icon, desc }) => (
                    <button
                      key={id}
                      type="button"
                      className={`theme-mode-option ${themeMode === id ? "active" : ""}`}
                      onClick={() => setThemeMode(id)}
                    >
                      <div className="theme-mode-icon">
                        <Icon size={22} />
                      </div>
                      <div className="theme-mode-info">
                        <span className="theme-mode-label">{label}</span>
                        <span className="theme-mode-desc">{desc}</span>
                      </div>
                      {themeMode === id && <span className="theme-mode-check">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="card settings-card">
                <h2 className="settings-card-title">Accent Color</h2>
                <p className="settings-card-desc">
                  Pick a color that personalizes buttons, links, and highlights across the app.
                </p>
                <div className="accent-color-grid">
                  {Object.entries(ACCENT_PRESETS).map(([key, { label, color }]) => (
                    <button
                      key={key}
                      type="button"
                      className={`accent-color-option ${accentKey === key ? "active" : ""}`}
                      onClick={() => setAccent(key)}
                      title={label}
                    >
                      <span className="accent-swatch" style={{ background: color }} />
                      <span className="accent-label">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="card settings-card theme-preview-card">
                <h2 className="settings-card-title">Live Preview</h2>
                <div className="theme-preview" data-theme={resolvedTheme}>
                  <div className="theme-preview-sidebar" />
                  <div className="theme-preview-main">
                    <div className="theme-preview-header" />
                    <div className="theme-preview-card">
                      <div className="theme-preview-line long" />
                      <div className="theme-preview-line short" />
                      <button type="button" className="theme-preview-btn">Button</button>
                    </div>
                  </div>
                </div>
                <p className="settings-card-desc theme-preview-note">
                  Currently using <strong>{themeMode === "system" ? "System" : themeMode === "dark" ? "Dark" : "Light"}</strong> mode
                  {themeMode === "system" && ` (${resolvedTheme})`} with <strong>{ACCENT_PRESETS[accentKey]?.label}</strong> accent.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;

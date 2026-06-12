import React, { createContext, useContext, useState, useEffect } from "react";
import * as api from "../services/api";
import { useToast } from "./ToastContext";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (userData) => {
    try {
      const data = await api.loginUser(userData);
      localStorage.setItem("user", JSON.stringify(data.data));
      setUser(data.data);
      addToast("Logged in successfully", "success");
      return true;
    } catch (error) {
      addToast(error.response?.data?.message || "Login failed", "error");
      return false;
    }
  };

  const register = async (userData) => {
    try {
      const data = await api.registerUser(userData);
      localStorage.setItem("user", JSON.stringify(data.data));
      setUser(data.data);
      addToast("Account created successfully", "success");
      return true;
    } catch (error) {
      addToast(error.response?.data?.message || "Registration failed", "error");
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
    addToast("Logged out successfully", "info");
  };

  const updateProfile = async (userData) => {
    try {
      const data = await api.updateProfile(userData);
      localStorage.setItem("user", JSON.stringify(data.data));
      setUser(data.data);
      addToast("Profile updated successfully", "success");
      return true;
    } catch (error) {
      addToast(error.response?.data?.message || "Profile update failed", "error");
      return false;
    }
  };

  const updatePassword = async (passwordData) => {
    try {
      await api.updatePassword(passwordData);
      addToast("Password updated successfully", "success");
      return true;
    } catch (error) {
      addToast(error.response?.data?.message || "Password update failed", "error");
      return false;
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    updatePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

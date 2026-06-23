import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { connectSocket, disconnectSocket, getSocket, setEnterpriseSocketEnabled } from "../services/socket";
import { useAuth } from "./AuthContext";
import { useApiHealth } from "./ApiHealthContext";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const { isV2, loading: healthLoading } = useApiHealth();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    setEnterpriseSocketEnabled(isV2);
  }, [isV2]);

  useEffect(() => {
    if (!user?.token || !isV2 || healthLoading) {
      disconnectSocket();
      setConnected(false);
      return;
    }

    const socket = connectSocket(user.token);
    if (!socket) return;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    if (socket.connected) setConnected(true);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      disconnectSocket();
      setConnected(false);
    };
  }, [user?.token, isV2, healthLoading]);

  const subscribe = useCallback((event, handler) => {
    const socket = getSocket();
    if (!socket) return () => {};
    socket.on(event, handler);
    return () => socket.off(event, handler);
  }, []);

  return (
    <SocketContext.Provider value={{ connected, subscribe, socket: getSocket(), isV2 }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
};

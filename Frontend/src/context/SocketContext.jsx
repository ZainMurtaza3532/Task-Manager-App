import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { connectSocket, disconnectSocket, getSocket, setEnterpriseSocketEnabled } from "../services/socket";
import { useAuth } from "./AuthContext";
import { useApiHealth } from "./ApiHealthContext";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const { isV2, loading: healthLoading } = useApiHealth();
  const [connected, setConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState([]);

  useEffect(() => {
    setEnterpriseSocketEnabled(isV2);
  }, [isV2]);

  useEffect(() => {
    if (!user?.token || !isV2 || healthLoading) {
      disconnectSocket();
      setConnected(false);
      setOnlineUserIds([]);
      return;
    }

    const socket = connectSocket(user.token);
    if (!socket) return;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => {
      setConnected(false);
      setOnlineUserIds([]);
    };
    const onPresence = (payload) => {
      setOnlineUserIds(payload?.onlineUserIds || []);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("presence_update", onPresence);

    if (socket.connected) setConnected(true);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("presence_update", onPresence);
      disconnectSocket();
      setConnected(false);
      setOnlineUserIds([]);
    };
  }, [user?.token, isV2, healthLoading]);

  const subscribe = useCallback((event, handler) => {
    const socket = getSocket();
    if (!socket) return () => {};
    socket.on(event, handler);
    return () => socket.off(event, handler);
  }, []);

  const isUserOnline = useCallback(
    (userId) => !!(userId && onlineUserIds.includes(userId.toString())),
    [onlineUserIds]
  );

  return (
    <SocketContext.Provider
      value={{ connected, subscribe, socket: getSocket(), isV2, onlineUserIds, isUserOnline }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
};

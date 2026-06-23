import { io } from "socket.io-client";
import { SOCKET_URL } from "../utils/constants";

let socket = null;
let enterpriseEnabled = false;

export const setEnterpriseSocketEnabled = (enabled) => {
  enterpriseEnabled = enabled;
  if (!enabled) disconnectSocket();
};

export const connectSocket = (token) => {
  if (!enterpriseEnabled) return null;
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["polling", "websocket"],
    reconnection: true,
    reconnectionAttempts: 3,
    reconnectionDelay: 2000,
    timeout: 10000,
  });

  socket.on("connect_error", () => {
    // Stop retry spam when server has no Socket.IO (v1 backend)
    socket.io.opts.reconnection = false;
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export const joinWorkspace = (workspaceId) => {
  socket?.emit("join_workspace", workspaceId);
};

export const joinTeam = (teamId) => {
  socket?.emit("join_team", teamId);
};

export const leaveTeam = (teamId) => {
  socket?.emit("leave_team", teamId);
};

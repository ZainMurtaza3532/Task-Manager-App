import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  fetchWorkspaces,
  fetchWorkspace,
  createWorkspace,
  switchWorkspace,
  fetchTeams,
} from "../services/api";
import { joinWorkspace } from "../services/socket";
import { useAuth } from "./AuthContext";
import { useApiHealth } from "./ApiHealthContext";

const WorkspaceContext = createContext(null);

export const WorkspaceProvider = ({ children }) => {
  const { user } = useAuth();
  const { isV2 } = useApiHealth();
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadWorkspaces = useCallback(async () => {
    if (!user || !isV2) return;
    setLoading(true);
    try {
      const res = await fetchWorkspaces();
      setWorkspaces(res.data || []);
      if (res.data?.length > 0) {
        const current = user.currentWorkspace
          ? res.data.find((w) => w._id === user.currentWorkspace) || res.data[0]
          : res.data[0];
        setCurrentWorkspace(current);
        joinWorkspace(current._id);
        const teamsRes = await fetchTeams({ workspaceId: current._id });
        setTeams(teamsRes.data || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user, isV2]);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  const selectWorkspace = async (workspaceId) => {
    await switchWorkspace(workspaceId);
    const res = await fetchWorkspace(workspaceId);
    setCurrentWorkspace(res.data.workspace);
    setTeams(res.data.teams || []);
    joinWorkspace(workspaceId);
  };

  const addWorkspace = async (data) => {
    const res = await createWorkspace(data);
    setWorkspaces((prev) => [...prev, res.data]);
    await selectWorkspace(res.data._id);
    return res.data;
  };

  const refreshTeams = async () => {
    if (!currentWorkspace) return;
    const res = await fetchTeams({ workspaceId: currentWorkspace._id });
    setTeams(res.data || []);
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        teams,
        loading,
        loadWorkspaces,
        selectWorkspace,
        addWorkspace,
        refreshTeams,
        setTeams,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
};

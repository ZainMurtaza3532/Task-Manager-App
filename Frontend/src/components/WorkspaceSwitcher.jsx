import React, { useState } from "react";
import { Building2, ChevronDown, Plus } from "lucide-react";
import { useWorkspace } from "../context/WorkspaceContext";

const WorkspaceSwitcher = () => {
  const { workspaces, currentWorkspace, selectWorkspace, addWorkspace } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await addWorkspace({ name: name.trim() });
    setName("");
    setShowCreate(false);
    setOpen(false);
  };

  if (!workspaces.length) return null;

  return (
    <div className="workspace-switcher">
      <button className="workspace-switcher-btn" onClick={() => setOpen(!open)}>
        <Building2 size={16} />
        <span>{currentWorkspace?.name || "Workspace"}</span>
        <ChevronDown size={14} />
      </button>

      {open && (
        <div className="workspace-dropdown">
          {workspaces.map((ws) => (
            <button
              key={ws._id}
              className={`workspace-option ${currentWorkspace?._id === ws._id ? "active" : ""}`}
              onClick={() => { selectWorkspace(ws._id); setOpen(false); }}
            >
              {ws.name}
            </button>
          ))}
          <hr />
          {showCreate ? (
            <form onSubmit={handleCreate} className="workspace-create-form">
              <input
                type="text"
                placeholder="Workspace name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn btn-primary btn-sm">Create</button>
            </form>
          ) : (
            <button className="workspace-option" onClick={() => setShowCreate(true)}>
              <Plus size={14} /> New Workspace
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkspaceSwitcher;

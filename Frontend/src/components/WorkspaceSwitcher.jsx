import React, { useState } from "react";
import { Building2, ChevronDown, Plus, Users, UserPlus, X } from "lucide-react";
import { useWorkspace } from "../context/WorkspaceContext";
import { useAuth } from "../context/AuthContext";
import { inviteToWorkspace } from "../services/api";
import { useToast } from "../context/ToastContext";
import { ROLES } from "../utils/constants";

const WorkspaceSwitcher = () => {
  const { workspaces, currentWorkspace, selectWorkspace, addWorkspace, refreshWorkspace } = useWorkspace();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [name, setName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [submitting, setSubmitting] = useState(false);

  const members = currentWorkspace?.members || [];
  const myRole = members.find((m) => (m.user?._id || m.user) === user?._id)?.role
    || (currentWorkspace?.owner?._id === user?._id || currentWorkspace?.owner === user?._id ? "admin" : null);
  const canInvite = ["admin", "manager"].includes(myRole);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await addWorkspace({ name: name.trim() });
    setName("");
    setShowCreate(false);
    setOpen(false);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !currentWorkspace) return;
    setSubmitting(true);
    try {
      await inviteToWorkspace(currentWorkspace._id, { email: inviteEmail.trim(), role: inviteRole });
      addToast("Member added to workspace", "success");
      setInviteEmail("");
      setShowInvite(false);
      await refreshWorkspace();
    } catch (err) {
      addToast(err.response?.data?.message || "Invite failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="workspace-switcher">
      <button className="workspace-switcher-btn" onClick={() => setOpen(!open)}>
        <Building2 size={16} />
        <span>{currentWorkspace?.name || "Workspace"}</span>
        {members.length > 0 && <span className="workspace-member-count">{members.length}</span>}
        <ChevronDown size={14} />
      </button>

      {open && (
        <div className="workspace-dropdown workspace-dropdown-lg">
          <div className="workspace-dropdown-section">
            <span className="workspace-dropdown-label">Switch workspace</span>
            {workspaces.length === 0 && <p className="workspace-empty-hint">No workspace yet</p>}
            {workspaces.map((ws) => (
              <button
                key={ws._id}
                type="button"
                className={`workspace-option ${currentWorkspace?._id === ws._id ? "active" : ""}`}
                onClick={() => { selectWorkspace(ws._id); }}
              >
                <Building2 size={14} />
                {ws.name}
              </button>
            ))}
          </div>

          {currentWorkspace && (
            <div className="workspace-dropdown-section">
              <div className="workspace-members-header">
                <span className="workspace-dropdown-label">
                  <Users size={14} /> Members ({members.length})
                </span>
                {canInvite && (
                  <button type="button" className="workspace-invite-btn" onClick={() => setShowInvite(!showInvite)}>
                    <UserPlus size={14} /> Invite
                  </button>
                )}
              </div>

              {showInvite && (
                <form className="workspace-invite-form" onSubmit={handleInvite}>
                  <input
                    type="email"
                    placeholder="Email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                  <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                    {Object.entries(ROLES).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                    {submitting ? "..." : "Add"}
                  </button>
                  <button type="button" className="btn-icon" onClick={() => setShowInvite(false)}>
                    <X size={14} />
                  </button>
                </form>
              )}

              <div className="workspace-members-list">
                {members.map((m) => {
                  const memberId = m.user?._id || m.user;
                  const isSelf = memberId === user?._id;
                  return (
                    <div key={memberId} className="workspace-member-item">
                      <span className="member-avatar sm">{m.user?.name?.charAt(0) || "?"}</span>
                      <div className="workspace-member-info">
                        <span className="workspace-member-name">
                          {m.user?.name || "User"}
                          {isSelf && " (you)"}
                        </span>
                        <span className="workspace-member-email">{m.user?.email}</span>
                      </div>
                      <span className="workspace-member-role" style={{ color: ROLES[m.role]?.color }}>
                        {ROLES[m.role]?.label || m.role}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
            <button type="button" className="workspace-option" onClick={() => setShowCreate(true)}>
              <Plus size={14} /> New Workspace
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkspaceSwitcher;

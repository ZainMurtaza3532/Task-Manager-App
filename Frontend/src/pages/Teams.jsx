import React, { useState } from "react";
import { Users, Plus, Link2, Check, X, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useWorkspace } from "../context/WorkspaceContext";
import { inviteTeamMember, regenerateTeamInvite } from "../services/api";
import { useToast } from "../context/ToastContext";
import { ROLES } from "../utils/constants";

const Teams = () => {
  const { teams, currentWorkspace, refreshTeams, addWorkspace, workspaces, loading } = useWorkspace();
  const { addToast } = useToast();
  const [showInvite, setShowInvite] = useState(null);
  const [showWorkspaceCreate, setShowWorkspaceCreate] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [inviteForm, setInviteForm] = useState({ email: "", role: "member" });
  const [copied, setCopied] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!workspaceName.trim()) return;
    setSubmitting(true);
    try {
      await addWorkspace({ name: workspaceName.trim() });
      addToast("Workspace created", "success");
      setShowWorkspaceCreate(false);
      setWorkspaceName("");
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to create workspace", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteForm.email.trim()) {
      addToast("Enter an email address", "error");
      return;
    }
    setSubmitting(true);
    try {
      await inviteTeamMember(showInvite, inviteForm);
      addToast("Member invited successfully", "success");
      setShowInvite(null);
      setInviteForm({ email: "", role: "member" });
      refreshTeams();
    } catch (err) {
      addToast(err.response?.data?.message || "Invite failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const copyInviteLink = async (team) => {
    try {
      let code = team.inviteCode;
      if (!code) {
        const res = await regenerateTeamInvite(team._id);
        code = res.data.inviteCode;
      }
      const link = `${window.location.origin}/join-team?code=${code}`;
      await navigator.clipboard.writeText(link);
      setCopied(team._id);
      addToast("Invite link copied", "success");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      addToast("Failed to copy link", "error");
    }
  };

  if (!loading && workspaces.length === 0) {
    return (
      <div className="page teams-page">
        <div className="teams-empty-workspace card">
          <Building2 size={48} />
          <h2>Create your workspace</h2>
          <p>A workspace is required to view teams and invite members.</p>
          {showWorkspaceCreate ? (
            <form className="teams-workspace-form" onSubmit={handleCreateWorkspace}>
              <input
                required
                placeholder="Workspace name (e.g. My Company)"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                autoFocus
              />
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowWorkspaceCreate(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Creating..." : "Create Workspace"}
                </button>
              </div>
            </form>
          ) : (
            <button className="btn btn-primary btn-lg" onClick={() => setShowWorkspaceCreate(true)}>
              <Plus size={18} /> Create Workspace
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page teams-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Users size={28} /> Teams
          </h1>
          <p className="page-subtitle">
            {currentWorkspace
              ? `Teams in ${currentWorkspace.name} — invite members and collaborate.`
              : "Collaborate with your team"}
          </p>
        </div>
      </div>

      {showInvite && (
        <div className="modal-overlay" onClick={() => setShowInvite(null)}>
          <form className="modal-dialog" onSubmit={handleInvite} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Invite Team Member</h3>
              <button type="button" className="modal-close" onClick={() => setShowInvite(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-hint">
                The user must already have a TaskFlow account. They will be added to this team immediately.
              </p>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  required
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="form-input"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  className="form-select"
                >
                  {Object.entries(ROLES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowInvite(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Sending..." : "Send Invite"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="teams-grid">
        {teams.map((team) => (
          <div key={team._id} className="team-card" style={{ borderTopColor: team.color }}>
            <div className="team-card-header">
              <h3>{team.name}</h3>
              <span className="team-member-count">{team.members?.length || 0} members</span>
            </div>
            <p className="team-card-desc">{team.description || "No description"}</p>
            <div className="team-members-preview">
              {team.members?.slice(0, 5).map((m) => (
                <span key={m.user?._id || m.user} className="member-avatar" title={m.user?.name}>
                  {m.user?.name?.charAt(0) || "?"}
                </span>
              ))}
              {(team.members?.length || 0) > 5 && (
                <span className="member-avatar more">+{team.members.length - 5}</span>
              )}
            </div>
            <div className="team-card-actions">
              <Link to={`/teams/${team._id}`} className="btn btn-primary btn-sm">
                Open Dashboard
              </Link>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowInvite(team._id)}>
                <Plus size={14} /> Add Member
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => copyInviteLink(team)}>
                {copied === team._id ? <Check size={14} /> : <Link2 size={14} />} Copy Link
              </button>
            </div>
          </div>
        ))}
        {teams.length === 0 && !loading && (
          <div className="empty-state">
            <Users size={48} />
            <h3>No teams available</h3>
            <p>You are not part of any teams yet. Ask your admin for an invite link to join.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Teams;

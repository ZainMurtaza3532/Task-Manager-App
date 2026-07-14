import React, { useState } from "react";
import { Users, Plus, Link2, Check, X, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useWorkspace } from "../context/WorkspaceContext";
import { createTeam, inviteTeamMember, regenerateTeamInvite } from "../services/api";
import { useToast } from "../context/ToastContext";
import { useSocket } from "../context/SocketContext";
import { ROLES } from "../utils/constants";

const TEAM_COLORS = ["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const Teams = () => {
  const { teams, currentWorkspace, refreshTeams, addWorkspace, workspaces, loading } = useWorkspace();
  const { addToast } = useToast();
  const { onlineUserIds } = useSocket();
  const [showInvite, setShowInvite] = useState(null);
  const [showWorkspaceCreate, setShowWorkspaceCreate] = useState(false);
  const [showTeamCreate, setShowTeamCreate] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [teamForm, setTeamForm] = useState({ name: "", description: "", color: TEAM_COLORS[0] });
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

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!teamForm.name.trim()) {
      addToast("Enter a team name", "error");
      return;
    }
    if (!currentWorkspace?._id) {
      addToast("Select or create a workspace first", "error");
      return;
    }
    setSubmitting(true);
    try {
      await createTeam({
        name: teamForm.name.trim(),
        description: teamForm.description.trim(),
        workspaceId: currentWorkspace._id,
        color: teamForm.color,
      });
      addToast("Team created", "success");
      setShowTeamCreate(false);
      setTeamForm({ name: "", description: "", color: TEAM_COLORS[0] });
      await refreshTeams();
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to create team", "error");
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

  const isOnline = (member) => {
    const id = member.user?._id || member.user;
    return id && onlineUserIds.includes(id.toString());
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
      <div className="page-header teams-page-header">
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
        {currentWorkspace && (
          <button className="btn btn-primary" onClick={() => setShowTeamCreate(true)}>
            <Plus size={16} /> Create Team
          </button>
        )}
      </div>

      {showTeamCreate && (
        <div className="modal-overlay" onClick={() => setShowTeamCreate(false)}>
          <form className="modal-dialog" onSubmit={handleCreateTeam} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Team</h3>
              <button type="button" className="modal-close" onClick={() => setShowTeamCreate(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Team name</label>
                <input
                  required
                  placeholder="e.g. Product Design"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                  className="form-input"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  placeholder="What does this team work on?"
                  value={teamForm.description}
                  onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                  className="form-textarea"
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Color</label>
                <div className="label-swatches">
                  {TEAM_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`label-swatch ${teamForm.color === c ? "active" : ""}`}
                      style={{ background: c }}
                      onClick={() => setTeamForm({ ...teamForm, color: c })}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowTeamCreate(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Creating..." : "Create Team"}
              </button>
            </div>
          </form>
        </div>
      )}

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
                <span
                  key={m.user?._id || m.user}
                  className={`member-avatar ${isOnline(m) ? "online" : ""}`}
                  title={`${m.user?.name || "Member"}${isOnline(m) ? " · Online" : " · Offline"}`}
                >
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
            <h3>No teams yet</h3>
            <p>Create your first team to start collaborating, or join with an invite link.</p>
            <button className="btn btn-primary" onClick={() => setShowTeamCreate(true)}>
              <Plus size={16} /> Create Team
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Teams;

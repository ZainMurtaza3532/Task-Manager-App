import React, { useState } from "react";
import { Users, Plus, Link2, Copy, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useWorkspace } from "../context/WorkspaceContext";
import { createTeam, inviteTeamMember, regenerateTeamInvite } from "../services/api";
import { useToast } from "../context/ToastContext";
import { ROLES } from "../utils/constants";

const Teams = () => {
  const { teams, currentWorkspace, refreshTeams } = useWorkspace();
  const { addToast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", color: "#6366f1" });
  const [inviteForm, setInviteForm] = useState({ email: "", role: "member" });
  const [copied, setCopied] = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!currentWorkspace) { addToast("Create a workspace first", "error"); return; }
    try {
      await createTeam({ ...form, workspaceId: currentWorkspace._id });
      addToast("Team created", "success");
      setShowCreate(false);
      setForm({ name: "", description: "", color: "#6366f1" });
      refreshTeams();
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to create team", "error");
    }
  };

  const handleInvite = async (teamId) => {
    try {
      await inviteTeamMember(teamId, inviteForm);
      addToast("Member invited", "success");
      setShowInvite(null);
      setInviteForm({ email: "", role: "member" });
    } catch (err) {
      addToast(err.response?.data?.message || "Invite failed", "error");
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

  return (
    <div className="page teams-page">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Users size={28} /> Teams</h1>
          <p className="page-subtitle">
            {currentWorkspace ? `Teams in ${currentWorkspace.name}` : "Collaborate with your team"}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Create Team
        </button>
      </div>

      {showCreate && (
        <form className="modal-form" onSubmit={handleCreate}>
          <h3>Create Team</h3>
          <input required placeholder="Team name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create</button>
          </div>
        </form>
      )}

      <div className="teams-grid">
        {teams.map((team) => (
          <div key={team._id} className="team-card" style={{ borderTopColor: team.color }}>
            <div className="team-card-header">
              <h3>{team.name}</h3>
              <span className="team-member-count">{team.members?.length || 0} members</span>
            </div>
            <p>{team.description || "No description"}</p>
            <div className="team-members-preview">
              {team.members?.slice(0, 5).map((m) => (
                <span key={m.user?._id || m.user} className="member-avatar" title={m.user?.name}>
                  {m.user?.name?.charAt(0) || "?"}
                </span>
              ))}
            </div>
            <div className="team-card-actions">
              <Link to={`/teams/${team._id}`} className="btn btn-primary btn-sm">Open Dashboard</Link>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowInvite(team._id)}>
                <Plus size={14} /> Invite
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => copyInviteLink(team)}>
                {copied === team._id ? <Check size={14} /> : <Link2 size={14} />} Link
              </button>
            </div>

            {showInvite === team._id && (
              <div className="invite-form">
                <input placeholder="Email" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} />
                <select value={inviteForm.role} onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}>
                  {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <button className="btn btn-primary btn-sm" onClick={() => handleInvite(team._id)}>Send Invite</button>
              </div>
            )}
          </div>
        ))}
        {teams.length === 0 && (
          <div className="empty-state">
            <Users size={48} />
            <h3>No teams yet</h3>
            <p>Create a team to start collaborating</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Teams;

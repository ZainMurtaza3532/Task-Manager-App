import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Users, CheckSquare, Activity, MessageSquare, Plus, Trash2, X, ListPlus } from "lucide-react";
import {
  fetchTeam,
  inviteTeamMember,
  updateTeamMemberRole,
  removeTeamMember,
  updateTask,
} from "../services/api";
import { joinTeam, leaveTeam } from "../services/socket";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import ActivityFeed from "../components/ActivityFeed";
import TeamChat from "../components/TeamChat";
import TaskCard from "../components/TaskCard";
import TeamTaskForm from "../components/TeamTaskForm";
import { ROLES } from "../utils/constants";

const TeamDashboard = () => {
  const { id } = useParams();
  const { subscribe, isUserOnline } = useSocket();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("tasks");
  const [showInvite, setShowInvite] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "member" });
  const [submitting, setSubmitting] = useState(false);

  const loadTeam = useCallback(() => {
    if (!id) return;
    setLoading(true);
    fetchTeam(id)
      .then((res) => setData(res.data))
      .catch(() => addToast("Failed to load team", "error"))
      .finally(() => setLoading(false));
  }, [id, addToast]);

  useEffect(() => {
    if (!id) return;
    joinTeam(id);
    loadTeam();

    const refreshTeam = (payload) => {
      if (!payload?.task) return;
      setData((prev) => {
        if (!prev) return prev;
        const updatedTask = payload.task;
        const existingTask = prev.tasks.find((task) => task._id === updatedTask._id);
        const updatedTasks = existingTask
          ? prev.tasks.map((task) => (task._id === updatedTask._id ? updatedTask : task))
          : [updatedTask, ...prev.tasks];
        const updatedStats = {
          ...prev.stats,
          total: updatedTasks.length,
          pending: updatedTasks.filter((t) => t.status === "pending").length,
          inProgress: updatedTasks.filter((t) => t.status === "in-progress").length,
          completed: updatedTasks.filter((t) => t.status === "completed").length,
        };
        return { ...prev, tasks: updatedTasks, stats: updatedStats };
      });
    };

    const addActivity = (activity) => {
      setData((prev) => (prev ? { ...prev, activities: [activity, ...prev.activities] } : prev));
    };

    const unsubTask = subscribe("task_update", refreshTeam);
    const unsubActivity = subscribe("team_activity", addActivity);

    return () => {
      unsubTask();
      unsubActivity();
      leaveTeam(id);
    };
  }, [id, subscribe, loadTeam]);

  const currentMember = data?.team?.members?.find(
    (m) => (m.user?._id || m.user) === user?._id
  );
  const isAdmin = currentMember?.role === "admin";
  const canManageTasks = ["admin", "manager", "member"].includes(currentMember?.role);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteForm.email.trim()) return;
    setSubmitting(true);
    try {
      await inviteTeamMember(id, inviteForm);
      addToast("Member added successfully", "success");
      setShowInvite(false);
      setInviteForm({ email: "", role: "member" });
      loadTeam();
    } catch (err) {
      addToast(err.response?.data?.message || "Invite failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (memberId, role) => {
    try {
      await updateTeamMemberRole(id, memberId, role);
      addToast("Role updated", "success");
      loadTeam();
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to update role", "error");
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!window.confirm(`Remove ${memberName} from this team?`)) return;
    try {
      await removeTeamMember(id, memberId);
      addToast("Member removed", "success");
      loadTeam();
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to remove member", "error");
    }
  };

  const handleComplete = async (task) => {
    try {
      await updateTask(task._id, { status: "completed" });
      addToast("Task completed", "success");
      loadTeam();
    } catch {
      addToast("Failed to update task", "error");
    }
  };

  const closeTaskForm = () => {
    setShowTaskForm(false);
    setEditingTask(null);
  };

  if (loading) {
    return (
      <div className="page team-dashboard">
        <div className="loading-state">Loading team...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page team-dashboard">
        <div className="empty-state">
          <Users size={48} />
          <h3>Team not found</h3>
        </div>
      </div>
    );
  }

  const { team, tasks, activities, stats } = data;

  return (
    <div className="page team-dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title team-title-accent" style={{ borderLeftColor: team.color }}>
            {team.name}
          </h1>
          <p className="page-subtitle">
            {team.description || "Team workspace"}
            {team.workspace?.name && (
              <span className="team-workspace-tag"> • {team.workspace.name}</span>
            )}
          </p>
        </div>
        <div className="page-header-actions">
          {canManageTasks && (
            <button className="btn btn-primary" onClick={() => { setEditingTask(null); setShowTaskForm(true); }}>
              <ListPlus size={16} /> Add Task
            </button>
          )}
          {isAdmin && (
            <button className="btn btn-secondary" onClick={() => setShowInvite(true)}>
              <Plus size={16} /> Add Member
            </button>
          )}
        </div>
      </div>

      <div className="team-stats-row">
        <div className="stat-card"><span>{stats.total}</span><label>Total Tasks</label></div>
        <div className="stat-card"><span>{stats.pending}</span><label>Pending</label></div>
        <div className="stat-card"><span>{stats.inProgress}</span><label>In Progress</label></div>
        <div className="stat-card"><span>{stats.completed}</span><label>Completed</label></div>
        <div className="stat-card"><span>{stats.members}</span><label>Members</label></div>
      </div>

      <div className="team-tabs">
        {[
          { id: "tasks", label: "Tasks", icon: CheckSquare },
          { id: "activity", label: "Activity", icon: Activity },
          { id: "chat", label: "Chat", icon: MessageSquare },
          { id: "members", label: "Members", icon: Users },
        ].map(({ id: tabId, label, icon: Icon }) => (
          <button key={tabId} className={`team-tab ${tab === tabId ? "active" : ""}`} onClick={() => setTab(tabId)}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      <div className="team-tab-content">
        {tab === "tasks" && (
          <div className="tasks-grid">
            {tasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                showAssignee
                onEdit={canManageTasks ? (t) => { setEditingTask(t); setShowTaskForm(true); } : undefined}
                onComplete={canManageTasks ? handleComplete : undefined}
              />
            ))}
            {tasks.length === 0 && (
              <div className="empty-state compact">
                <CheckSquare size={40} />
                <h3>No team tasks yet</h3>
                <p>Create a task and assign it to a team member.</p>
                {canManageTasks && (
                  <button className="btn btn-primary" onClick={() => setShowTaskForm(true)}>
                    <ListPlus size={16} /> Add First Task
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        {tab === "activity" && <ActivityFeed activities={activities} />}
        {tab === "chat" && <TeamChat teamId={id} />}
        {tab === "members" && (
          <div className="members-panel">
            <div className="members-list">
              {team.members?.map((m) => {
                const memberId = m.user?._id || m.user;
                const isSelf = memberId === user?._id;
                const assignedCount = tasks.filter(
                  (t) => (t.assignee?._id || t.assignee) === memberId
                ).length;
                return (
                  <div key={memberId} className="member-row">
                    <div className={`member-avatar lg ${isUserOnline(memberId) ? "online" : ""}`}>
                      {m.user?.name?.charAt(0) || "?"}
                    </div>
                    <div className="member-info">
                      <strong>
                        {m.user?.name || "User"}
                        {isSelf && <span className="member-you"> (you)</span>}
                        <span className={`presence-pill ${isUserOnline(memberId) ? "online" : "offline"}`}>
                          {isUserOnline(memberId) ? "Online" : "Offline"}
                        </span>
                      </strong>
                      <span>{m.user?.email}</span>
                      <span className="member-task-count">{assignedCount} task{assignedCount !== 1 ? "s" : ""} assigned</span>
                    </div>
                    {isAdmin && !isSelf ? (
                      <select
                        className="role-select"
                        value={m.role}
                        onChange={(e) => handleRoleChange(memberId, e.target.value)}
                      >
                        {Object.entries(ROLES).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="role-badge" style={{ color: ROLES[m.role]?.color }}>
                        {ROLES[m.role]?.label || m.role}
                      </span>
                    )}
                    {isAdmin && !isSelf && (
                      <button
                        type="button"
                        className="btn-icon danger"
                        title="Remove member"
                        onClick={() => handleRemoveMember(memberId, m.user?.name)}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showTaskForm && (
        <div className="modal-overlay" onClick={closeTaskForm}>
          <div className="modal-dialog modal-dialog-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingTask ? "Edit Team Task" : "Create Team Task"}</h3>
              <button type="button" className="modal-close" onClick={closeTaskForm}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <TeamTaskForm
                teamId={id}
                members={team.members || []}
                initialData={editingTask}
                onSuccess={() => { closeTaskForm(); loadTeam(); }}
                onCancel={closeTaskForm}
              />
            </div>
          </div>
        </div>
      )}

      {showInvite && (
        <div className="modal-overlay" onClick={() => setShowInvite(false)}>
          <form className="modal-dialog" onSubmit={handleInvite} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Team Member</h3>
              <button type="button" className="modal-close" onClick={() => setShowInvite(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-hint">
                Enter the email of an existing TaskFlow user to add them to {team.name}.
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
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowInvite(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Adding..." : "Add Member"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TeamDashboard;

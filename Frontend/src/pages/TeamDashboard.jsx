import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Users, CheckSquare, Activity, MessageSquare } from "lucide-react";
import { fetchTeam } from "../services/api";
import { joinTeam, leaveTeam } from "../services/socket";
import { useSocket } from "../context/SocketContext";
import ActivityFeed from "../components/ActivityFeed";
import TeamChat from "../components/TeamChat";
import TaskCard from "../components/TaskCard";
import { ROLES } from "../utils/constants";

const TeamDashboard = () => {
  const { id } = useParams();
  const { subscribe } = useSocket();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("tasks");

  useEffect(() => {
    if (!id) return;
    joinTeam(id);
    setLoading(true);
    fetchTeam(id)
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));

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
      setData((prev) => prev ? { ...prev, activities: [activity, ...prev.activities] } : prev);
    };

    const unsubTask = subscribe("task_update", refreshTeam);
    const unsubActivity = subscribe("team_activity", addActivity);

    return () => {
      unsubTask();
      unsubActivity();
      leaveTeam(id);
    };
  }, [id, subscribe]);

  if (loading) return <div className="page"><p>Loading team...</p></div>;
  if (!data) return <div className="page"><p>Team not found</p></div>;

  const { team, tasks, activities, stats } = data;

  return (
    <div className="page team-dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ borderLeftColor: team.color, borderLeftWidth: "4px", borderLeftStyle: "solid", paddingLeft: "12px" }}>
            {team.name}
          </h1>
          <p className="page-subtitle">{team.description || "Team workspace"}</p>
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
            {tasks.map((task) => <TaskCard key={task._id} task={task} />)}
            {tasks.length === 0 && <p className="empty-text">No team tasks yet</p>}
          </div>
        )}
        {tab === "activity" && <ActivityFeed activities={activities} />}
        {tab === "chat" && <TeamChat teamId={id} />}
        {tab === "members" && (
          <div className="members-list">
            {team.members?.map((m) => (
              <div key={m.user?._id || m.user} className="member-row">
                <div className="member-avatar lg">{m.user?.name?.charAt(0) || "?"}</div>
                <div>
                  <strong>{m.user?.name || "User"}</strong>
                  <span>{m.user?.email}</span>
                </div>
                <span className="role-badge" style={{ color: ROLES[m.role]?.color }}>
                  {ROLES[m.role]?.label || m.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamDashboard;

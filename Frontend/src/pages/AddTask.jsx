import React, { useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import TaskForm from "../components/TaskForm";
import AddTaskPreview from "../components/AddTaskPreview";
import { useWorkspace } from "../context/WorkspaceContext";
import { ArrowLeft, PlusCircle } from "lucide-react";

const EMPTY_FORM = {
  title: "",
  description: "",
  priority: "medium",
  status: "pending",
  dueDate: "",
  category: "General",
  subTasks: [],
  team: "",
  assignee: "",
};

const AddTask = () => {
  const { teams, currentWorkspace } = useWorkspace();
  const [previewData, setPreviewData] = useState(EMPTY_FORM);

  const handleFormChange = useCallback((data) => {
    setPreviewData(data);
  }, []);

  const selectedTeam = useMemo(
    () => teams.find((t) => t._id === previewData.team),
    [teams, previewData.team]
  );

  const assigneeName = useMemo(() => {
    const members = selectedTeam?.members?.length
      ? selectedTeam.members
      : currentWorkspace?.members || [];
    const match = members.find(
      (m) => (m.user?._id || m.user) === previewData.assignee
    );
    return match?.user?.name || null;
  }, [selectedTeam, currentWorkspace, previewData.assignee]);

  return (
    <div className="page add-task-page">
      <Link to="/tasks" className="add-task-back">
        <ArrowLeft size={16} />
        Back to tasks
      </Link>

      <div className="add-task-header">
        <div className="add-task-header-icon">
          <PlusCircle size={24} />
        </div>
        <div className="add-task-header-text">
          <h1 className="page-title">Add New Task</h1>
          <p className="page-subtitle">
            Fill in the essentials first — team and sub-tasks are optional.
          </p>
        </div>
      </div>

      <div className="add-task-layout">
        <div className="task-form-card card">
          <TaskForm variant="page" onFormChange={handleFormChange} />
        </div>

        <aside className="add-task-aside">
          <AddTaskPreview
            formData={previewData}
            teamName={selectedTeam?.name}
            assigneeName={assigneeName}
          />
        </aside>
      </div>
    </div>
  );
};

export default AddTask;

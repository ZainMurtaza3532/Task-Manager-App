import React, { useState, useEffect } from "react";
import { createTask, updateTask } from "../services/api";
import { useToast } from "../context/ToastContext";
import { CATEGORIES } from "../utils/constants";

const TeamTaskForm = ({ teamId, members = [], initialData = null, onSuccess, onCancel }) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    status: "pending",
    dueDate: "",
    category: "General",
    assignee: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        priority: initialData.priority || "medium",
        status: initialData.status || "pending",
        dueDate: initialData.dueDate
          ? new Date(initialData.dueDate).toISOString().split("T")[0]
          : "",
        category: initialData.category || "General",
        assignee: initialData.assignee?._id || initialData.assignee || "",
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        team: teamId,
        assignee: formData.assignee || undefined,
        dueDate: formData.dueDate || null,
      };

      if (initialData?._id) {
        await updateTask(initialData._id, payload);
        addToast("Task updated", "success");
      } else {
        await createTask(payload);
        addToast("Team task created", "success");
      }
      onSuccess?.();
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to save task", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="team-task-form">
      <div className="form-group">
        <label className="form-label">Task Title *</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="form-input"
          placeholder="Enter task title"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="form-input"
          placeholder="Task details..."
          rows={3}
        />
      </div>

      <div className="form-row-2">
        <div className="form-group">
          <label className="form-label">Assign To</label>
          <select name="assignee" value={formData.assignee} onChange={handleChange} className="form-select">
            <option value="">Unassigned</option>
            {members.map((m) => {
              const id = m.user?._id || m.user;
              return (
                <option key={id} value={id}>
                  {m.user?.name || "Member"} ({m.role})
                </option>
              );
            })}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Priority</label>
          <select name="priority" value={formData.priority} onChange={handleChange} className="form-select">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <div className="form-row-2">
        <div className="form-group">
          <label className="form-label">Status</label>
          <select name="status" value={formData.status} onChange={handleChange} className="form-select">
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Due Date</label>
          <input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} className="form-input" />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Category</label>
        <select name="category" value={formData.category} onChange={handleChange} className="form-select">
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Saving..." : initialData ? "Update Task" : "Create Task"}
        </button>
      </div>
    </form>
  );
};

export default TeamTaskForm;

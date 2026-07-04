import React from "react";
import TaskForm from "./TaskForm";
import { X, Pencil, PlusCircle } from "lucide-react";

const EditModal = ({ task, onClose }) => {
  if (!task) return null;
  const isEdit = !!task._id;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog modal-dialog-lg task-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="task-modal-title-wrap">
            <span className="task-modal-icon">
              {isEdit ? <Pencil size={20} /> : <PlusCircle size={20} />}
            </span>
            <div>
              <h3>{isEdit ? "Edit Task" : "Create Task"}</h3>
              <p className="task-modal-subtitle">
                {isEdit ? "Update details, assignee, or status" : "Fill in the details and optionally assign to a team member"}
              </p>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body task-modal-body">
          <TaskForm initialData={task} onSuccess={onClose} />
        </div>
      </div>
    </div>
  );
};

export default EditModal;

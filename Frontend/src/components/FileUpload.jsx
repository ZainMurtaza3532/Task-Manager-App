import React, { useState, useCallback } from "react";
import { Upload, X, FileText, Image, FileArchive, Download, Trash2 } from "lucide-react";
import { uploadTaskFiles, deleteTaskFile } from "../services/api";
import { MAX_FILE_SIZE } from "../utils/constants";
import { useToast } from "../context/ToastContext";

const getFileIcon = (mimeType) => {
  if (mimeType?.startsWith("image/")) return Image;
  if (mimeType?.includes("zip")) return FileArchive;
  return FileText;
};

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const FileUpload = ({ taskId, attachments = [], onUpdate }) => {
  const { addToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(async (files) => {
    const validFiles = Array.from(files).filter((f) => {
      if (f.size > MAX_FILE_SIZE) {
        addToast(`${f.name} exceeds 10MB limit`, "error");
        return false;
      }
      return true;
    });

    if (!validFiles.length || !taskId) return;

    setUploading(true);
    try {
      const res = await uploadTaskFiles(taskId, validFiles);
      onUpdate?.(res.data);
      addToast(`${validFiles.length} file(s) uploaded`, "success");
    } catch (err) {
      addToast(err.response?.data?.message || "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  }, [taskId, onUpdate, addToast]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDelete = async (attachmentId) => {
    try {
      await deleteTaskFile(taskId, attachmentId);
      onUpdate?.(attachments.filter((a) => a._id !== attachmentId));
      addToast("File deleted", "success");
    } catch {
      addToast("Failed to delete file", "error");
    }
  };

  return (
    <div className="file-upload-section">
      <div
        className={`file-dropzone ${dragOver ? "drag-over" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <Upload size={24} />
        <p>Drag & drop files here or click to browse</p>
        <span>Images, PDF, DOCX, PPTX, Excel, ZIP — max 10MB</span>
        <input
          type="file"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          disabled={uploading || !taskId}
          style={{ display: "none" }}
          id={`file-input-${taskId}`}
        />
        <label htmlFor={`file-input-${taskId}`} className="btn btn-secondary btn-sm">
          {uploading ? "Uploading..." : "Browse Files"}
        </label>
      </div>

      {attachments.length > 0 && (
        <div className="attachment-list">
          {attachments.map((file) => {
            const Icon = getFileIcon(file.mimeType);
            const isImage = file.mimeType?.startsWith("image/");
            return (
              <div key={file._id} className="attachment-item">
                {isImage ? (
                  <img src={file.url} alt={file.originalName} className="attachment-preview" />
                ) : (
                  <div className="attachment-icon"><Icon size={20} /></div>
                )}
                <div className="attachment-info">
                  <span className="attachment-name">{file.originalName}</span>
                  <span className="attachment-size">{formatSize(file.size)}</span>
                </div>
                <div className="attachment-actions">
                  <a href={file.url} target="_blank" rel="noopener noreferrer" className="btn-icon" title="Download">
                    <Download size={14} />
                  </a>
                  <button className="btn-icon" onClick={() => handleDelete(file._id)} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FileUpload;

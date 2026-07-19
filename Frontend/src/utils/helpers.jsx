// Format date for display
export const formatDate = (dateString) => {
  if (!dateString) return "No due date";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Format date for input[type="date"]
export const formatDateForInput = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toISOString().split("T")[0];
};

// Check if a date is overdue
export const isOverdue = (dueDate, status) => {
  if (!dueDate || status === "completed") return false;
  return new Date(dueDate) < new Date();
};

// Get relative time string
export const getRelativeTime = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
};

export const formatRelativeTime = getRelativeTime;

// Truncate text
export const truncateText = (text, maxLength = 80) => {
  if (!text) return "";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

// Get days until due
export const getDaysUntilDue = (dueDate) => {
  if (!dueDate) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((due - now) / 86400000);
  return diffDays;
};

// Get due date label
export const getDueDateLabel = (dueDate, status) => {
  if (!dueDate) return null;
  if (status === "completed") return { text: "Completed", className: "due-completed" };
  const days = getDaysUntilDue(dueDate);
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, className: "due-overdue" };
  if (days === 0) return { text: "Due today", className: "due-today" };
  if (days === 1) return { text: "Due tomorrow", className: "due-soon" };
  if (days <= 3) return { text: `${days}d left`, className: "due-soon" };
  return { text: `${days}d left`, className: "due-normal" };
};

// Format markdown text for chat bubbles
export const formatMessage = (text) => {
  if (!text) return null;
  return text.split("\n").map((line, i) => {
    const parts = [];
    const re = /\*\*(.+?)\*\*/g;
    let last = 0;
    let match;
    while ((match = re.exec(line)) !== null) {
      if (match.index > last) parts.push(line.slice(last, match.index));
      parts.push(<strong key={`${i}-${match.index}`}>{match[1]}</strong>);
      last = match.index + match[0].length;
    }
    if (last < line.length) parts.push(line.slice(last));
    return (
      <span key={i}>
        {i > 0 && <br />}
        {parts.length ? parts : line}
      </span>
    );
  });
};

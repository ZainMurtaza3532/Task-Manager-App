const BREAKDOWN_TEMPLATES = {
  website: ["Research & Planning", "Design UI/UX", "Build Frontend", "Build Backend API", "Database Setup", "Testing", "Deployment"],
  app: ["Define Requirements", "UI Design", "Core Features", "Authentication", "Testing", "App Store Deployment"],
  default: ["Planning & Research", "Design", "Implementation", "Testing", "Review & Launch"],
};

export const breakdownTaskLocal = (input) => {
  const lower = input.toLowerCase();
  let template = BREAKDOWN_TEMPLATES.default;

  if (lower.includes("website") || lower.includes("e-commerce") || lower.includes("ecommerce")) {
    template = ["Research target audience", "Design homepage", "Product listing page", "Shopping cart", "Checkout flow", "Payment integration", "Testing", "Deployment"];
  } else if (lower.includes("app") || lower.includes("mobile")) {
    template = BREAKDOWN_TEMPLATES.app;
  } else if (lower.includes("marketing") || lower.includes("campaign")) {
    template = ["Define goals & audience", "Content strategy", "Create assets", "Launch campaign", "Track metrics", "Optimize results"];
  } else {
    const words = input.split(/\s+/).filter((w) => w.length > 3);
    if (words.length >= 3) {
      template = [
        `Research: ${words.slice(0, 2).join(" ")}`,
        `Plan ${input}`,
        `Execute core work`,
        `Review & test`,
        `Finalize & deliver`,
      ];
    }
  }

  return template;
};

export const suggestTasksLocal = (tasks) => {
  const open = tasks.filter((t) => t.status !== "completed");
  const overdue = open.filter((t) => t.dueDate && new Date(t.dueDate) < new Date());
  const highPriority = open.filter((t) => t.priority === "high");
  const suggestions = [];

  if (overdue.length > 0) {
    suggestions.push({
      title: `Complete overdue: ${overdue[0].title}`,
      reason: `This task is past its due date and needs immediate attention.`,
      priority: "high",
    });
  }

  if (highPriority.length > 0 && !overdue.includes(highPriority[0])) {
    suggestions.push({
      title: `Focus on: ${highPriority[0].title}`,
      reason: "High-priority task that should be tackled next.",
      priority: "high",
    });
  }

  const inProgress = open.filter((t) => t.status === "in-progress");
  if (inProgress.length > 0) {
    suggestions.push({
      title: `Finish in-progress: ${inProgress[0].title}`,
      reason: "Complete started work before taking on new tasks.",
      priority: "medium",
    });
  }

  if (open.length === 0) {
    suggestions.push(
      { title: "Review weekly goals", reason: "No open tasks — great time to plan ahead.", priority: "medium" },
      { title: "Organize task categories", reason: "Keep your workspace structured.", priority: "low" }
    );
  } else if (suggestions.length < 3) {
    const pending = open.filter((t) => t.status === "pending");
    if (pending[0]) {
      suggestions.push({
        title: `Start: ${pending[0].title}`,
        reason: "Next pending task in your queue.",
        priority: pending[0].priority || "medium",
      });
    }
  }

  return { suggestions: suggestions.slice(0, 5) };
};

export const predictPriorityLocal = ({ title, description, dueDate, complexity }, workload) => {
  let score = 50;
  const reasons = [];

  if (dueDate) {
    const days = Math.ceil((new Date(dueDate) - new Date()) / 86400000);
    if (days < 0) { score += 40; reasons.push("Task is overdue"); }
    else if (days <= 1) { score += 35; reasons.push("Due within 24 hours"); }
    else if (days <= 3) { score += 25; reasons.push("Due within 3 days"); }
    else if (days <= 7) { score += 15; reasons.push("Due this week"); }
  }

  if (complexity === "high") { score += 20; reasons.push("High complexity"); }
  else if (complexity === "low") { score -= 10; reasons.push("Low complexity"); }

  if (workload > 10) { score += 10; reasons.push("Heavy workload — prioritize carefully"); }
  if (title?.toLowerCase().includes("urgent") || description?.toLowerCase().includes("urgent")) {
    score += 25;
    reasons.push("Marked as urgent");
  }

  const priority = score >= 70 ? "high" : score >= 45 ? "medium" : "low";
  return {
    priority,
    reason: reasons.join(". ") || `Based on due date and complexity analysis for "${title}".`,
    confidence: Math.min(95, Math.max(60, score)),
  };
};

export const buildInsightsLocal = (tasks, timeEntries) => {
  const completed = tasks.filter((t) => t.status === "completed");
  const overdue = tasks.filter(
    (t) => t.status !== "completed" && t.dueDate && new Date(t.dueDate) < new Date()
  );
  const totalHours = timeEntries.reduce((sum, e) => sum + (e.duration || 0), 0) / 3600;

  const dayCompletions = {};
  completed.forEach((t) => {
    const day = new Date(t.updatedAt).toLocaleDateString("en-US", { weekday: "long" });
    dayCompletions[day] = (dayCompletions[day] || 0) + 1;
  });
  const mostProductiveDay = Object.entries(dayCompletions).sort((a, b) => b[1] - a[1])[0];

  const completionRate = tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0;
  const insights = [];

  if (completionRate >= 70) {
    insights.push({ title: "Strong Completion Rate", description: `You've completed ${completionRate}% of tasks. Keep up the momentum!`, type: "positive" });
  } else if (completionRate < 40 && tasks.length > 3) {
    insights.push({ title: "Completion Needs Attention", description: `Only ${completionRate}% completed. Try focusing on 2-3 tasks at a time.`, type: "warning" });
  }

  if (overdue.length > 0) {
    insights.push({ title: `${overdue.length} Overdue Task(s)`, description: "Prioritize overdue items or reschedule realistic due dates.", type: "warning" });
  }

  if (mostProductiveDay) {
    insights.push({ title: `Most Productive: ${mostProductiveDay[0]}`, description: `You complete the most tasks on ${mostProductiveDay[0]}s. Schedule important work then.`, type: "tip" });
  }

  if (totalHours > 0) {
    insights.push({ title: "Time Tracking Active", description: `You've logged ${totalHours.toFixed(1)} hours. ${totalHours < 5 ? "Consider tracking more for better insights." : "Great job tracking your time!"}`, type: "tip" });
  }

  if (insights.length === 0) {
    insights.push({ title: "Getting Started", description: "Add more tasks and track time to unlock deeper productivity insights.", type: "tip" });
  }

  const summary = tasks.length === 0
    ? "No task data yet. Start adding tasks to get personalized insights."
    : `Over the last 30 days: ${tasks.length} tasks, ${completed.length} completed (${completionRate}%), ${overdue.length} overdue, ${totalHours.toFixed(1)}h tracked.`;

  return {
    stats: {
      totalTasks: tasks.length,
      completed: completed.length,
      overdue: overdue.length,
      completionRate,
      totalHours: +totalHours.toFixed(1),
      mostProductiveDay: mostProductiveDay?.[0] || null,
    },
    insights,
    summary,
  };
};

export const chatLocal = (message, tasks, history = []) => {
  const lower = message.toLowerCase().trim();
  const open = tasks.filter((t) => t.status !== "completed");
  const overdue = open.filter((t) => t.dueDate && new Date(t.dueDate) < new Date());
  const high = open.filter((t) => t.priority === "high");
  const pending = open.filter((t) => t.status === "pending");
  const inProgress = open.filter((t) => t.status === "in-progress");
  const completed = tasks.filter((t) => t.status === "completed");

  const buildTaskList = (items) =>
    items.map((t) => `• ${t.title}${t.dueDate ? ` (due ${new Date(t.dueDate).toLocaleDateString()})` : ""}`).join("\n");

  // Match a specific task mentioned in the message
  const mentionedTask = open.find((t) => lower.includes(t.title.toLowerCase().slice(0, Math.min(12, t.title.length))));

  if (/^(hi|hello|hey|good\s*(morning|afternoon|evening))[\s!.?]*$/i.test(lower)) {
    return open.length > 0
      ? `Hello! You have ${open.length} open task${open.length !== 1 ? "s" : ""}. I can help you prioritize, plan your day, check overdue items, or break down a project. What would you like to know?`
      : "Hello! You have no open tasks right now — great job staying on top of things. I can help you plan new work, suggest tasks, or share productivity tips. What would you like to do?";
  }

  if (/thank|thanks|thx/i.test(lower)) {
    return "You're welcome! Let me know if you need help with prioritization, planning, or anything else with your tasks.";
  }

  if (lower.includes("overdue") || lower.includes("late") || lower.includes("past due")) {
    if (overdue.length === 0) {
      return "Good news — you have no overdue tasks right now. To stay ahead, review tasks due in the next 2–3 days and block time for them on your calendar.";
    }
    return `You have ${overdue.length} overdue task${overdue.length !== 1 ? "s" : ""}:\n\n${buildTaskList(overdue)}\n\nI recommend tackling "${overdue[0].title}" first. If the deadline has passed, either complete it today or reschedule with a realistic new due date.`;
  }

  if (lower.includes("priority") || lower.includes("important") || lower.includes("focus") || lower.includes("should i work")) {
    if (high.length > 0) {
      return `Your highest-priority tasks:\n\n${buildTaskList(high)}\n\nStart with "${high[0].title}" — it's marked high priority${high[0].dueDate ? ` and due ${new Date(high[0].dueDate).toLocaleDateString()}` : ""}. Complete or make visible progress on this before switching to lower-priority work.`;
    }
    if (overdue.length > 0) {
      return `No tasks are marked high priority, but you have overdue items that need attention:\n\n${buildTaskList(overdue)}\n\nI'd treat "${overdue[0].title}" as your top priority today.`;
    }
    if (open.length > 0) {
      const sorted = [...open].sort((a, b) => {
        const score = (t) => (t.priority === "high" ? 3 : t.priority === "medium" ? 2 : 1) + (t.dueDate ? 1 / Math.max(1, (new Date(t.dueDate) - new Date()) / 86400000) : 0);
        return score(b) - score(a);
      });
      return `Here's what I'd focus on based on priority and due dates:\n\n${buildTaskList(sorted.slice(0, 3))}\n\nStart with "${sorted[0].title}". Consider marking urgent items as high priority so they're easier to spot.`;
    }
    return "All tasks are completed! Use this time to plan your next goals or review what's coming up next week.";
  }

  if (lower.includes("suggest") || lower.includes("what should") || lower.includes("next") || lower.includes("recommend")) {
    const { suggestions } = suggestTasksLocal(tasks);
    if (suggestions.length === 0) {
      return "I don't have enough task data to make suggestions yet. Add some tasks with due dates and priorities, and I'll recommend what to work on next.";
    }
    return `Based on your current workload, here's what I recommend:\n\n${suggestions.map((s, i) => `${i + 1}. **${s.title}**\n   ${s.reason}`).join("\n\n")}\n\nPick the first one and set a 25-minute focus block to get started.`;
  }

  if (lower.includes("how many") || lower.includes("summary") || lower.includes("status") || lower.includes("overview")) {
    return `Here's your task overview:\n\n• ${open.length} open tasks\n• ${pending.length} pending\n• ${inProgress.length} in progress\n• ${overdue.length} overdue\n• ${completed.length} completed\n\n${overdue.length > 0 ? `⚠️ Address overdue tasks first.` : inProgress.length > 0 ? `You have work in progress — finish "${inProgress[0].title}" before starting new tasks.` : open.length > 0 ? `Next up: "${pending[0]?.title || open[0].title}"` : "You're all caught up!"}`;
  }

  if (lower.includes("break down") || lower.includes("breakdown") || lower.includes("split") || lower.includes("steps for")) {
    const project = message.replace(/break\s*(it\s*)?down|breakdown|split|steps\s*for/gi, "").trim() || "your project";
    const steps = breakdownTaskLocal(project);
    return `Here's a step-by-step plan for "${project}":\n\n${steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nWork through these in order. Each step can become its own task in TaskFlow for better tracking.`;
  }

  if (lower.includes("plan my day") || lower.includes("today") || lower.includes("schedule")) {
    const todayTasks = open.filter((t) => {
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      const now = new Date();
      return due.toDateString() === now.toDateString() || due < now;
    });
    const focus = [...overdue, ...todayTasks, ...high, ...inProgress].filter((t, i, arr) => arr.findIndex((x) => x._id === t._id) === i).slice(0, 4);
    if (focus.length === 0) {
      return `No urgent tasks for today. Suggested plan:\n\n1. Review your ${open.length} open tasks and pick the 2 most impactful\n2. Block 2 hours of deep work on your top task\n3. Clear any quick pending items (under 15 min each)\n4. Plan tomorrow's priorities before you finish`;
    }
    return `Suggested plan for today:\n\n${focus.map((t, i) => `${i + 1}. ${t.title}${t.dueDate ? ` (due ${new Date(t.dueDate).toLocaleDateString()})` : ""}`).join("\n")}\n\nTip: Tackle the hardest task first when your energy is highest, then handle smaller items in the afternoon.`;
  }

  if (lower.includes("pending") || lower.includes("not started")) {
    if (pending.length === 0) {
      return inProgress.length > 0
        ? `No pending tasks — you have ${inProgress.length} in progress. Focus on finishing "${inProgress[0].title}" before starting anything new.`
        : "No pending tasks. You're either all done or everything is already in progress!";
    }
    return `You have ${pending.length} pending task${pending.length !== 1 ? "s" : ""}:\n\n${buildTaskList(pending.slice(0, 8))}\n\nPick one, set a timer for 25 minutes, and get started. Starting is often the hardest part.`;
  }

  if (lower.includes("in progress") || lower.includes("working on")) {
    if (inProgress.length === 0) {
      return "Nothing is currently in progress. Pick a pending task and move it to in-progress when you start working on it — this helps track your active focus.";
    }
    return `Tasks currently in progress:\n\n${buildTaskList(inProgress)}\n\nTry to finish "${inProgress[0].title}" before starting new work. Context-switching reduces productivity.`;
  }

  if (lower.includes("deadline") || lower.includes("due date") || lower.includes("due soon")) {
    const withDue = open.filter((t) => t.dueDate).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    if (withDue.length === 0) {
      return "None of your open tasks have due dates set. Adding due dates helps me prioritize and remind you what's urgent.";
    }
    const soon = withDue.filter((t) => {
      const days = (new Date(t.dueDate) - new Date()) / 86400000;
      return days >= 0 && days <= 7;
    });
    return `Upcoming deadlines:\n\n${buildTaskList(withDue.slice(0, 6))}\n\n${soon.length > 0 ? `${soon.length} task${soon.length !== 1 ? "s" : ""} due within 7 days — plan time for these now.` : "No tasks due in the next week."}`;
  }

  if (lower.includes("tip") || lower.includes("productivity") || lower.includes("advice") || lower.includes("help me")) {
    const tips = overdue.length > 0
      ? [`Clear your ${overdue.length} overdue task${overdue.length !== 1 ? "s" : ""} first — they create mental overhead`, "Use time tracking to see where your hours actually go", "Limit yourself to 3 priority tasks per day", "Break large tasks into 30-minute subtasks"]
      : ["Start each day by picking your single most important task", "Use the Pomodoro technique: 25 min focus, 5 min break", "Batch similar tasks together to reduce context switching", "Review and update task priorities every Monday"];
    return `Productivity tips for you:\n\n${tips.map((t, i) => `${i + 1}. ${t}`).join("\n")}\n\nWant something more specific? Ask about your priorities, overdue tasks, or daily plan.`;
  }

  if (mentionedTask) {
    return `About "${mentionedTask.title}":\n\n• Status: ${mentionedTask.status}\n• Priority: ${mentionedTask.priority}${mentionedTask.dueDate ? `\n• Due: ${new Date(mentionedTask.dueDate).toLocaleDateString()}` : ""}\n\n${mentionedTask.status === "pending" ? "This hasn't been started yet. Set a 30-minute block today to make initial progress." : mentionedTask.status === "in-progress" ? "You're already working on this — focus on completing it before switching tasks." : "Review this task and update its status as needed."}`;
  }

  const taskMatch = open.find((t) => {
    const words = t.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    return words.some((w) => lower.includes(w));
  });
  if (taskMatch) {
    return `Regarding "${taskMatch.title}": it's currently ${taskMatch.status} with ${taskMatch.priority} priority${taskMatch.dueDate ? `, due ${new Date(taskMatch.dueDate).toLocaleDateString()}` : ""}. ${taskMatch.status === "pending" ? "I'd recommend starting this soon." : "Keep pushing — you're making progress!"}`;
  }

  if (open.length > 0) {
    return `I can help with your ${open.length} open task${open.length !== 1 ? "s" : ""}. Try asking:\n\n• "What should I focus on?"\n• "Which tasks are overdue?"\n• "Plan my day"\n• "Break down [project name]"\n• "Give me a task summary"\n\nOr mention a specific task name and I'll give you tailored advice.`;
  }

  return "I'm your TaskFlow assistant. Add tasks to get personalized help, or ask me for productivity tips, planning advice, or how to break down a project into steps.";
};

export const isOpenAIError = (error) => {
  if (!error) return true;
  const msg = error.message || "";
  return (
    error.status === 429 ||
    error.status === 401 ||
    error.status === 403 ||
    error.code === "insufficient_quota" ||
    msg.includes("quota") ||
    msg.includes("API key") ||
    msg.includes("Incorrect API key")
  );
};

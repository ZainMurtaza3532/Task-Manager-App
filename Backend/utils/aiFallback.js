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
  const lower = message.toLowerCase();
  const open = tasks.filter((t) => t.status !== "completed");
  const overdue = open.filter((t) => t.dueDate && new Date(t.dueDate) < new Date());
  const high = open.filter((t) => t.priority === "high");
  const pending = open.filter((t) => t.status === "pending");
  const inProgress = open.filter((t) => t.status === "in-progress");

  const buildTaskList = (items) => items.map((t) => `• ${t.title}${t.dueDate ? ` (due ${new Date(t.dueDate).toLocaleDateString()})` : ""}`).join("\n");

  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return `Hello! I'm your TaskFlow AI assistant. You have ${open.length} open task(s). I can help with planning, prioritizing, and managing your work. What would you like to do first?`;
  }

  if (lower.includes("overdue") || lower.includes("late")) {
    if (overdue.length === 0) {
      return "Great news — you have no overdue tasks! Keep the momentum going by reviewing upcoming deadlines and planning your next priorities.";
    }
    return `You have ${overdue.length} overdue task(s):\n${buildTaskList(overdue)}\n\nStart with the most critical one: \"${overdue[0].title}\". If possible, reschedule or break it into smaller steps so you can make progress quickly.`;
  }

  if (lower.includes("priority") || lower.includes("important") || lower.includes("focus")) {
    if (high.length > 0) {
      return `Your top priority tasks are:\n${buildTaskList(high)}\n\nI suggest beginning with \"${high[0].title}\" because it is marked high priority and likely has the biggest impact.`;
    }
    if (open.length > 0) {
      return `No tasks are marked high priority right now. Here are your next candidates:\n${buildTaskList(open.slice(0, 3))}\n\nConsider making one of them a high-priority task if it has a deadline or important outcome.`;
    }
    return "All tasks are completed! This is a great opportunity to plan your next goals and set new priorities.";
  }

  if (lower.includes("suggest") || lower.includes("what should") || lower.includes("next")) {
    const { suggestions } = suggestTasksLocal(tasks);
    if (suggestions.length === 0) {
      return "You have no open tasks to analyze yet. Add your tasks and I can suggest what to work on next based on urgency and priority.";
    }
    return `Here are the best next actions based on your current task list:\n${suggestions.map((s, i) => `${i + 1}. ${s.title} — ${s.reason}`).join("\n")}`;
  }

  if (lower.includes("how many") || lower.includes("summary") || lower.includes("status")) {
    return `Task summary:\n• ${open.length} open tasks\n• ${pending.length} pending\n• ${inProgress.length} in progress\n• ${overdue.length} overdue\n• ${tasks.length - open.length} completed\n\nThis shows your current workload and helps identify where to focus next.`;
  }

  if (lower.includes("break down") || lower.includes("breakdown")) {
    const project = message.replace(/break\s*down/gi, "").trim() || "your project";
    const steps = breakdownTaskLocal(project);
    return `Here is a structured breakdown for \"${project}\":\n${steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nThese steps should help you make progress in a clear, manageable sequence.`;
  }

  if (lower.includes("tip") || lower.includes("productivity") || lower.includes("help")) {
    const tips = [
      "Review the most important task first and keep your focus there.",
      "Break larger tasks into smaller subtasks to reduce overwhelm.",
      "Use due dates and priority flags to decide what to tackle each day.",
      "Track time spent on tasks to improve future planning.",
      "Check overdue tasks daily and adjust your schedule as needed.",
    ];
    return `Productivity suggestions:\n${tips.map((t, i) => `${i + 1}. ${t}`).join("\n")}\n\nIf you want, I can help turn one of your tasks into a more detailed plan.`;
  }

  if (open.length > 0) {
    return `I can help you with your task planning and prioritization. You currently have ${open.length} open task(s). Try asking:\n• What should I focus on next?\n• Which tasks are overdue?\n• How should I prioritize my work?\n• Help me break down a task into steps.`;
  }

  return "I'm ready to help you manage your tasks. Add a task to get personalized advice, or ask me for planning tips and priority guidance.";
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

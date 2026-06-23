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

  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return `Hello! I'm your TaskFlow AI assistant. You have ${open.length} open task(s). How can I help you today?`;
  }

  if (lower.includes("overdue") || lower.includes("late")) {
    if (overdue.length === 0) return "Great news — you have no overdue tasks! 🎉";
    return `You have ${overdue.length} overdue task(s):\n${overdue.map((t) => `• ${t.title}`).join("\n")}\n\nI recommend tackling "${overdue[0].title}" first.`;
  }

  if (lower.includes("priority") || lower.includes("important") || lower.includes("focus")) {
    if (high.length > 0) return `Your highest priority tasks:\n${high.map((t) => `• ${t.title} (${t.status})`).join("\n")}\n\nStart with "${high[0].title}".`;
    if (open.length > 0) return `No high-priority tasks flagged. Your next task could be "${open[0].title}" (${open[0].priority} priority).`;
    return "All tasks are completed! Time to plan your next goals.";
  }

  if (lower.includes("suggest") || lower.includes("what should") || lower.includes("next")) {
    const { suggestions } = suggestTasksLocal(tasks);
    if (suggestions.length === 0) return "Add some tasks and I'll suggest what to work on next!";
    return `Here's what I recommend:\n${suggestions.map((s, i) => `${i + 1}. **${s.title}** — ${s.reason}`).join("\n")}`;
  }

  if (lower.includes("how many") || lower.includes("summary") || lower.includes("status")) {
    const pending = open.filter((t) => t.status === "pending").length;
    const inProg = open.filter((t) => t.status === "in-progress").length;
    return `Task Summary:\n• ${open.length} open tasks\n• ${pending} pending\n• ${inProg} in progress\n• ${overdue.length} overdue\n• ${tasks.length - open.length} completed`;
  }

  if (lower.includes("break down") || lower.includes("breakdown")) {
    const project = message.replace(/break\s*down/gi, "").trim() || "your project";
    const steps = breakdownTaskLocal(project);
    return `Here's a breakdown for "${project}":\n${steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`;
  }

  if (lower.includes("tip") || lower.includes("productivity") || lower.includes("help")) {
    const tips = [
      "Use the Kanban board to visualize workflow.",
      "Set due dates on high-priority tasks.",
      "Break large projects into sub-tasks.",
      "Track time to understand where your hours go.",
      "Review overdue tasks every morning.",
    ];
    return `Productivity Tips:\n${tips.map((t, i) => `${i + 1}. ${t}`).join("\n")}`;
  }

  if (open.length > 0) {
    return `I can help with task planning! You have ${open.length} open task(s). Try asking:\n• "What should I focus on?"\n• "Show overdue tasks"\n• "Break down [project name]"\n• "Give me a task summary"`;
  }

  return "I'm here to help with task management! Add some tasks and ask me about priorities, suggestions, or productivity tips.";
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

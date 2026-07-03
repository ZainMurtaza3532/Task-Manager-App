import OpenAI from "openai";
import Task from "../models/Task.js";
import TimeEntry from "../models/TimeEntry.js";
import {
  breakdownTaskLocal,
  suggestTasksLocal,
  predictPriorityLocal,
  buildInsightsLocal,
  chatLocal,
  isOpenAIError,
} from "../utils/aiFallback.js";

const getOpenAI = () => {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key || key === "your_openai_api_key") return null;
  return new OpenAI({ apiKey: key });
};

const chatCompletion = async (messages, maxTokens = 1200) => {
  const openai = getOpenAI();
  if (!openai) return null;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4",
      messages,
      max_tokens: maxTokens,
      temperature: 0.75,
    });
    return response.choices[0]?.message?.content || "";
  } catch (error) {
    if (isOpenAIError(error)) {
      console.warn("⚠️  OpenAI unavailable, using local AI fallback:", error.message);
      return null;
    }
    throw error;
  }
};

const parseJSON = (content, fallback) => {
  try {
    const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return fallback;
  }
};

const getUserTasks = (userId, filter = {}) =>
  Task.find({ user: userId, isDeleted: false, ...filter })
    .sort({ updatedAt: -1 })
    .select("title status priority category dueDate updatedAt createdAt")
    .lean();

export const breakdownTask = async (req, res, next) => {
  try {
    const { input } = req.body;
    if (!input?.trim()) {
      const error = new Error("Task description is required");
      error.statusCode = 400;
      throw error;
    }

    const content = await chatCompletion([
      {
        role: "system",
        content: `Break down the project into 5-10 actionable sub-tasks. Return ONLY a JSON array of strings.`,
      },
      { role: "user", content: input },
    ]);

    let subtasks;
    let source = "local";

    if (content) {
      subtasks = parseJSON(content, null);
      if (Array.isArray(subtasks)) source = "openai";
    }

    if (!Array.isArray(subtasks)) {
      subtasks = breakdownTaskLocal(input);
    }

    res.json({ success: true, data: { input, subtasks, source } });
  } catch (error) {
    next(error);
  }
};

export const suggestTasks = async (req, res, next) => {
  try {
    const tasks = await getUserTasks(req.user.id);

    const content = await chatCompletion([
      {
        role: "system",
        content: `Suggest 3-5 next tasks. Return JSON: { "suggestions": [{ "title": "", "reason": "", "priority": "high|medium|low" }] }`,
      },
      { role: "user", content: `Current tasks:\n${tasks.map((t) => `- ${t.title} (${t.status}, ${t.priority})`).join("\n") || "No tasks yet"}` },
    ]);

    let data;
    let source = "local";

    if (content) {
      const parsed = parseJSON(content, null);
      if (parsed?.suggestions) {
        data = parsed;
        source = "openai";
      }
    }

    if (!data) {
      data = suggestTasksLocal(tasks);
    }

    res.json({ success: true, data: { ...data, source } });
  } catch (error) {
    next(error);
  }
};

export const predictPriority = async (req, res, next) => {
  try {
    const { title, description, dueDate, complexity } = req.body;

    const workload = await Task.countDocuments({
      user: req.user.id,
      isDeleted: false,
      status: { $ne: "completed" },
    });

    const content = await chatCompletion([
      {
        role: "system",
        content: `Predict priority (high/medium/low). Return JSON: { "priority": "", "reason": "", "confidence": 0-100 }`,
      },
      {
        role: "user",
        content: `Title: ${title}\nDescription: ${description || "N/A"}\nDue: ${dueDate || "None"}\nComplexity: ${complexity || "medium"}\nOpen tasks: ${workload}`,
      },
    ], 300);

    let prediction;
    let source = "local";

    if (content) {
      const parsed = parseJSON(content, null);
      if (parsed?.priority) {
        prediction = parsed;
        source = "openai";
      }
    }

    if (!prediction) {
      prediction = predictPriorityLocal({ title, description, dueDate, complexity }, workload);
    }

    res.json({ success: true, data: { ...prediction, source } });
  } catch (error) {
    next(error);
  }
};

export const getProductivityInsights = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [tasks, timeEntries] = await Promise.all([
      Task.find({ user: req.user.id, isDeleted: false, createdAt: { $gte: thirtyDaysAgo } }).lean(),
      TimeEntry.find({ user: req.user.id, startTime: { $gte: thirtyDaysAgo }, isRunning: false }).lean(),
    ]);

    const localData = buildInsightsLocal(tasks, timeEntries);

    const content = await chatCompletion([
      {
        role: "system",
        content: `Return JSON: { "insights": [{ "title": "", "description": "", "type": "positive|warning|tip" }], "summary": "" }`,
      },
      {
        role: "user",
        content: `Tasks: ${localData.stats.totalTasks} total, ${localData.stats.completed} done, ${localData.stats.overdue} overdue, ${localData.stats.totalHours}h tracked. Best day: ${localData.stats.mostProductiveDay || "N/A"}.`,
      },
    ]);

    let source = "local";
    let aiInsights = { insights: localData.insights, summary: localData.summary };

    if (content) {
      const parsed = parseJSON(content, null);
      if (parsed?.insights) {
        aiInsights = parsed;
        source = "openai";
      }
    }

    res.json({
      success: true,
      data: { stats: localData.stats, ...aiInsights, source },
    });
  } catch (error) {
    next(error);
  }
};

export const chatWithAI = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;
    if (!message?.trim()) {
      const error = new Error("Message is required");
      error.statusCode = 400;
      throw error;
    }

    const tasks = await getUserTasks(req.user.id, { status: { $ne: "completed" } });

    const messages = [
      {
        role: "system",
        content: `You are TaskFlow Pro AI Assistant. You help users with task planning, prioritization, productivity, and project breakdown. User's open tasks: ${JSON.stringify(tasks)}. Provide thoughtful, detailed, and actionable advice. When possible, explain why recommendations make sense, describe the next steps, and mention any risks or follow-up actions. If the user question is vague, ask a clarifying question.`,
      },
      ...history.slice(-10).map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: message },
    ];

    const content = await chatCompletion(messages, 800);
    let reply;
    let source = "local";

    if (content) {
      reply = content;
      source = "openai";
    } else {
      reply = chatLocal(message, tasks, history);
    }

    res.json({ success: true, data: { reply, timestamp: new Date(), source } });
  } catch (error) {
    next(error);
  }
};

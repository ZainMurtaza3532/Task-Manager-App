import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Send, Lightbulb, Target, BarChart3, ListTree } from "lucide-react";
import { aiBreakdownTask, aiSuggestTasks, aiPredictPriority, aiGetInsights, aiChat } from "../services/api";
import { useToast } from "../context/ToastContext";
import { PRIORITIES } from "../utils/constants";

const AIAssistant = () => {
  const { addToast } = useToast();
  const [tab, setTab] = useState("chat");
  const [breakdownInput, setBreakdownInput] = useState("");
  const [subtasks, setSubtasks] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [insights, setInsights] = useState(null);
  const [priorityInput, setPriorityInput] = useState({ title: "", description: "", dueDate: "", complexity: "medium" });
  const [prediction, setPrediction] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (tab === "insights") {
      setLoading(true);
      aiGetInsights().then((r) => setInsights(r.data)).catch(() => addToast("Failed to load insights", "error")).finally(() => setLoading(false));
    }
  }, [tab, addToast]);

  const handleBreakdown = async () => {
    if (!breakdownInput.trim()) return;
    setLoading(true);
    try {
      const res = await aiBreakdownTask(breakdownInput);
      setSubtasks(res.data.subtasks || []);
    } catch (err) {
      addToast(err.response?.data?.message || "AI unavailable", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSuggest = async () => {
    setLoading(true);
    try {
      const res = await aiSuggestTasks();
      setSuggestions(res.data.suggestions || []);
    } catch (err) {
      addToast(err.response?.data?.message || "AI unavailable", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = async () => {
    if (!priorityInput.title.trim()) return;
    setLoading(true);
    try {
      const res = await aiPredictPriority(priorityInput);
      setPrediction(res.data);
    } catch (err) {
      addToast(err.response?.data?.message || "AI unavailable", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async (e) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;
    const userMsg = { role: "user", content: text };
    const historyBefore = [...messages, userMsg];
    setMessages(historyBefore);
    setChatInput("");
    setLoading(true);
    try {
      const res = await aiChat(text, messages);
      setMessages((prev) => [...prev, { role: "assistant", content: res.data.reply, source: res.data.source }]);
    } catch (err) {
      setMessages((prev) => prev.slice(0, -1));
      setChatInput(text);
      addToast(err.response?.data?.message || "AI unavailable", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const tabs = [
    { id: "chat", label: "Chat", icon: Sparkles },
    { id: "breakdown", label: "Breakdown", icon: ListTree },
    { id: "suggest", label: "Suggestions", icon: Lightbulb },
    { id: "priority", label: "Priority", icon: Target },
    { id: "insights", label: "Insights", icon: BarChart3 },
  ];

  return (
    <div className="page ai-page">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Sparkles size={28} /> AI Assistant</h1>
          <p className="page-subtitle">Smart task planning — works with OpenAI or built-in intelligence</p>
        </div>
      </div>

      <div className="ai-tabs">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} className={`ai-tab ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      <div className="ai-content">
        {tab === "chat" && (
          <div className="ai-chat">
            <div className="ai-messages">
              {messages.length === 0 && (
                <div className="ai-welcome">
                  <Sparkles size={48} />
                  <h3>How can I help you today?</h3>
                  <p>Ask me about task planning, prioritization, or productivity tips.</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`ai-message ${msg.role}`}>
                  {msg.content}
                  {msg.source === "local" && msg.role === "assistant" && (
                    <span className="ai-source-badge">Smart Assistant</span>
                  )}
                </div>
              ))}
              {loading && <div className="ai-message assistant typing">Thinking...</div>}
              <div ref={chatEndRef} />
            </div>
            <form className="ai-chat-input" onSubmit={handleChat}>
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask anything..." />
              <button type="submit" className="btn btn-primary" disabled={loading}><Send size={16} /></button>
            </form>
          </div>
        )}

        {tab === "breakdown" && (
          <div className="ai-panel">
            <h3>AI Task Breakdown</h3>
            <p>Enter a project and get actionable sub-tasks</p>
            <textarea
              value={breakdownInput}
              onChange={(e) => setBreakdownInput(e.target.value)}
              placeholder="e.g. Build E-Commerce Website"
              rows={3}
            />
            <button className="btn btn-primary" onClick={handleBreakdown} disabled={loading}>
              {loading ? "Generating..." : "Break Down Task"}
            </button>
            {subtasks.length > 0 && (
              <ul className="ai-subtask-list">
                {subtasks.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            )}
          </div>
        )}

        {tab === "suggest" && (
          <div className="ai-panel">
            <h3>Task Suggestions</h3>
            <p>AI suggests next tasks based on your progress</p>
            <button className="btn btn-primary" onClick={handleSuggest} disabled={loading}>
              {loading ? "Analyzing..." : "Get Suggestions"}
            </button>
            {suggestions.map((s, i) => (
              <div key={i} className="ai-suggestion-card">
                <strong>{s.title}</strong>
                <span className={`priority-badge priority-${s.priority}`}>{PRIORITIES[s.priority]?.label || s.priority}</span>
                <p>{s.reason}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "priority" && (
          <div className="ai-panel">
            <h3>Priority Prediction</h3>
            <input placeholder="Task title" value={priorityInput.title} onChange={(e) => setPriorityInput({ ...priorityInput, title: e.target.value })} />
            <textarea placeholder="Description" value={priorityInput.description} onChange={(e) => setPriorityInput({ ...priorityInput, description: e.target.value })} />
            <input type="date" value={priorityInput.dueDate} onChange={(e) => setPriorityInput({ ...priorityInput, dueDate: e.target.value })} />
            <select value={priorityInput.complexity} onChange={(e) => setPriorityInput({ ...priorityInput, complexity: e.target.value })}>
              <option value="low">Low Complexity</option>
              <option value="medium">Medium Complexity</option>
              <option value="high">High Complexity</option>
            </select>
            <button className="btn btn-primary" onClick={handlePredict} disabled={loading}>Predict Priority</button>
            {prediction && (
              <div className="ai-prediction">
                <span className={`priority-badge priority-${prediction.priority}`}>{prediction.priority?.toUpperCase()}</span>
                <p>{prediction.reason}</p>
                <span>Confidence: {prediction.confidence}%</span>
              </div>
            )}
          </div>
        )}

        {tab === "insights" && (
          <div className="ai-panel">
            <h3>Productivity Insights</h3>
            {loading ? <p>Loading insights...</p> : insights && (
              <>
                <div className="insights-stats">
                  <div className="stat-card"><span>{insights.stats?.completionRate}%</span><label>Completion Rate</label></div>
                  <div className="stat-card"><span>{insights.stats?.totalHours}h</span><label>Tracked Hours</label></div>
                  <div className="stat-card"><span>{insights.stats?.overdue}</span><label>Overdue</label></div>
                  <div className="stat-card"><span>{insights.stats?.mostProductiveDay || "N/A"}</span><label>Best Day</label></div>
                </div>
                <p className="insights-summary">{insights.summary}</p>
                {(insights.insights || []).map((ins, i) => (
                  <div key={i} className={`insight-card insight-${ins.type}`}>
                    <strong>{ins.title}</strong>
                    <p>{ins.description}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;

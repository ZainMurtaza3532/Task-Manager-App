import React, { useState, useEffect, useRef } from "react";
import { Send, Trash2 } from "lucide-react";
import { fetchChatMessages, sendChatMessage } from "../services/api";
import { useSocket } from "../context/SocketContext";
import { joinTeam } from "../services/socket";
import { formatRelativeTime } from "../utils/helpers";
import { useAuth } from "../context/AuthContext";

const TeamChat = ({ teamId }) => {
  const { user } = useAuth();
  const { subscribe } = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!teamId) return;
    joinTeam(teamId);
    setLoading(true);
    fetchChatMessages(teamId)
      .then((res) => setMessages(res.data || []))
      .finally(() => setLoading(false));

    const unsub = subscribe("chat_message", (msg) => {
      if (msg.team === teamId || msg.team?._id === teamId) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => unsub;
  }, [teamId, subscribe]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const content = input.trim();
    setInput("");
    try {
      const res = await sendChatMessage(teamId, content);
      setMessages((prev) => {
        if (prev.some((m) => m._id === res.data._id)) return prev;
        return [...prev, res.data];
      });
    } catch {
      setInput(content);
    }
  };

  return (
    <div className="team-chat">
      <div className="chat-messages">
        {loading ? (
          <p className="chat-loading">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="chat-empty">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender?._id === user?._id || msg.sender === user?._id;
            return (
              <div key={msg._id} className={`chat-message ${isOwn ? "own" : ""}`}>
                {!isOwn && <span className="chat-sender">{msg.sender?.name || "User"}</span>}
                <div className="chat-bubble">{msg.content}</div>
                <span className="chat-time">{formatRelativeTime(msg.createdAt)}</span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={!input.trim()}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default TeamChat;

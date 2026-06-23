import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Users, CheckCircle } from "lucide-react";
import { joinTeamByInvite } from "../services/api";
import { useToast } from "../context/ToastContext";

const JoinTeam = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [code, setCode] = useState(searchParams.get("code") || "");
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);
  const [team, setTeam] = useState(null);

  useEffect(() => {
    const inviteCode = searchParams.get("code");
    if (inviteCode) setCode(inviteCode);
  }, [searchParams]);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await joinTeamByInvite(code.trim());
      setTeam(res.data);
      setJoined(true);
      addToast("Successfully joined team!", "success");
    } catch (err) {
      addToast(err.response?.data?.message || "Invalid invite link", "error");
    } finally {
      setLoading(false);
    }
  };

  if (joined && team) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <CheckCircle size={64} color="var(--success)" />
          <h2>Welcome to {team.name}!</h2>
          <p>You've successfully joined the team.</p>
          <button className="btn btn-primary" onClick={() => navigate(`/teams/${team._id}`)}>
            Go to Team Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Users size={48} color="var(--accent)" style={{ margin: "0 auto 16px" }} />
        <h2>Join a Team</h2>
        <p>Enter your invite code or use an invite link</p>
        <form onSubmit={handleJoin}>
          <input
            type="text"
            placeholder="Invite code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? "Joining..." : "Join Team"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default JoinTeam;

import React from "react";
import { Play, Pause, Square, Clock } from "lucide-react";
import { useTimer } from "../hooks/useTimer";
import { Link } from "react-router-dom";

const TimerWidget = ({ compact = false }) => {
  const { entry, formatted, isRunning, isPaused, loading, pause, resume, stop } = useTimer();

  if (!entry && compact) return null;

  return (
    <div className={`timer-widget ${compact ? "compact" : ""}`}>
      {entry ? (
        <>
          <div className="timer-display">
            <Clock size={16} />
            <span className="timer-time">{formatted}</span>
            {!compact && entry.task?.title && (
              <span className="timer-task">{entry.task.title}</span>
            )}
          </div>
          <div className="timer-controls">
            {isPaused ? (
              <button className="btn-icon" onClick={resume} disabled={loading} title="Resume">
                <Play size={16} />
              </button>
            ) : isRunning ? (
              <button className="btn-icon" onClick={pause} disabled={loading} title="Pause">
                <Pause size={16} />
              </button>
            ) : null}
            <button className="btn-icon danger" onClick={stop} disabled={loading} title="Stop">
              <Square size={16} />
            </button>
          </div>
        </>
      ) : (
        <Link to="/time-tracking" className="timer-link">
          <Clock size={16} />
          {!compact && <span>Time Tracking</span>}
        </Link>
      )}
    </div>
  );
};

export default TimerWidget;

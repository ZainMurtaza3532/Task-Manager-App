import { useState, useEffect, useCallback, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import {
  fetchRunningTimer,
  startTimer,
  pauseTimer,
  resumeTimer,
  stopTimer,
} from "../services/api";

const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

export const useTimer = () => {
  const [entry, setEntry] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);

  const loadRunning = useCallback(async () => {
    try {
      const res = await fetchRunningTimer();
      setEntry(res.data);
    } catch {
      setEntry(null);
    }
  }, []);

  const { subscribe } = useSocket();

  useEffect(() => {
    loadRunning();
  }, [loadRunning]);

  useEffect(() => {
    const unsub1 = subscribe("time_entry_created", (payload) => {
      if (payload?.entry) setEntry(payload.entry);
    });
    const unsub2 = subscribe("time_entry_updated", (payload) => {
      if (payload?.entry) setEntry(payload.entry);
    });
    const unsub3 = subscribe("time_entry_deleted", (payload) => {
      if (payload?.entry?._id === entry?._id) {
        setEntry(null);
      }
    });
    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, [subscribe, entry?._id]);

  useEffect(() => {
    if (entry?.isRunning && !entry?.isPaused) {
      const start = new Date(entry.startTime).getTime();
      const paused = entry.totalPausedMs || 0;

      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - start - paused) / 1000));
      }, 1000);
    } else if (entry?.isRunning && entry?.isPaused) {
      const start = new Date(entry.startTime).getTime();
      const paused = (entry.totalPausedMs || 0) + (entry.pausedAt ? Date.now() - new Date(entry.pausedAt).getTime() : 0);
      setElapsed(Math.floor((Date.now() - start - paused) / 1000));
    } else {
      clearInterval(intervalRef.current);
      setElapsed(entry?.duration || 0);
    }

    return () => clearInterval(intervalRef.current);
  }, [entry]);

  const start = async (taskId, description = "") => {
    setLoading(true);
    try {
      const res = await startTimer({ taskId, description });
      setEntry(res.data);
      setElapsed(0);
    } finally {
      setLoading(false);
    }
  };

  const pause = async () => {
    if (!entry) return;
    const res = await pauseTimer(entry._id);
    setEntry(res.data);
  };

  const resume = async () => {
    if (!entry) return;
    const res = await resumeTimer(entry._id);
    setEntry(res.data);
  };

  const stop = async () => {
    if (!entry) return;
    setLoading(true);
    try {
      await stopTimer(entry._id);
      setEntry(null);
      setElapsed(0);
    } finally {
      setLoading(false);
    }
  };

  return {
    entry,
    elapsed,
    formatted: formatTime(elapsed),
    isRunning: !!entry?.isRunning,
    isPaused: !!entry?.isPaused,
    loading,
    start,
    pause,
    resume,
    stop,
    loadRunning,
  };
};

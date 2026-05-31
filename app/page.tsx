"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import {
  LiveAvatarSession,
  SessionEvent,
  SessionState,
} from "@heygen/liveavatar-web-sdk";

export default function AvatarDemo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sessionRef = useRef<LiveAvatarSession | null>(null);

  const [state, setState] = useState<SessionState>(SessionState.INACTIVE);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const startSession = useCallback(async () => {
    setError("");

    try {
      const res = await fetch("/api/get-access-token", { method: "POST" });
      const { token, error: tokenError } = await res.json();
      if (tokenError || !token) throw new Error(tokenError ?? "Failed to get token");

      const session = new LiveAvatarSession(token);
      sessionRef.current = session;

      session.on(SessionEvent.SESSION_STATE_CHANGED, (s) => setState(s));

      session.on(SessionEvent.SESSION_STREAM_READY, () => {
        if (videoRef.current) session.attach(videoRef.current);
      });

      await session.start();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start session");
      setState(SessionState.INACTIVE);
    }
  }, []);

  const stopSession = useCallback(async () => {
    await sessionRef.current?.stop();
    sessionRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setState(SessionState.INACTIVE);
    setText("");
  }, []);

  const speak = useCallback(async () => {
    if (!text.trim() || !sessionRef.current || state !== SessionState.CONNECTED) return;
    setIsSpeaking(true);
    try {
      sessionRef.current.repeat(text.trim());
      setText("");
    } finally {
      setIsSpeaking(false);
    }
  }, [text, state]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      speak();
    }
  };

  useEffect(() => {
    return () => { sessionRef.current?.stop(); };
  }, []);

  const isConnected = state === SessionState.CONNECTED;
  const isConnecting = state === SessionState.CONNECTING;
  const isInactive = state === SessionState.INACTIVE || state === SessionState.DISCONNECTED;

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-6 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Avatar Demo</h1>

      <div className="relative w-full max-w-lg aspect-video bg-gray-900 rounded-2xl overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        {isInactive && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
            Session not started
          </div>
        )}
        {isConnecting && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm animate-pulse">
            Connecting…
          </div>
        )}
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {isInactive ? (
        <button
          onClick={startSession}
          className="px-6 py-2.5 bg-white text-gray-950 rounded-full font-medium hover:bg-gray-100 transition-colors"
        >
          Start Session
        </button>
      ) : (
        <div className="w-full max-w-lg flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type something and press Enter…"
              disabled={!isConnected || isSpeaking}
              className="flex-1 px-4 py-2.5 bg-gray-800 rounded-full text-sm placeholder-gray-500 outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-40"
            />
            <button
              onClick={speak}
              disabled={!isConnected || isSpeaking || !text.trim()}
              className="px-5 py-2.5 bg-white text-gray-950 rounded-full font-medium text-sm hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSpeaking ? "Speaking…" : "Speak"}
            </button>
          </div>
          <button
            onClick={stopSession}
            className="text-gray-500 text-xs hover:text-gray-300 transition-colors self-center"
          >
            End session
          </button>
        </div>
      )}
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { SessionList } from "@/components/sidebar/SessionList";
import { ChatWindow } from "@/components/chat/ChatWindow";

export default function Home() {
  const [hasActiveModel, setHasActiveModel] = useState(false);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch("/api/health");
        const data = await res.json();
        setHasActiveModel(data.status === "ok");
      } catch {
        setHasActiveModel(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen">
      <SessionList />
      <ChatWindow hasActiveModel={hasActiveModel} />
    </div>
  );
}

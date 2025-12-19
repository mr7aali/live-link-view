/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useSocketContext } from "@/providers/SocketProvider";
import MessageList from "./MessageList";
import TypingIndicator from "./TypingIndicator";
import MessageInput from "./MessageInput";

export default function ChatWindow({
  conversationId,
}: {
  conversationId: string;
}) {
  const socketRef = useSocketContext();
  const [messages, setMessages] = useState<any[]>([]);
  const [typingUser, setTypingUser] = useState<string | null>(null);

  useEffect(() => {
    if (!socketRef) return;
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit("join", conversationId);

    socket.on("message:receive", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("typing:start", ({ userId }) => {
      setTypingUser(userId);
    });

    socket.on("typing:stop", () => {
      setTypingUser(null);
    });

    return () => {
      socket.off("message:receive");
      socket.off("typing:start");
      socket.off("typing:stop");
    };
  }, [conversationId, socketRef]);

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto border">
      <MessageList messages={messages} />
      <TypingIndicator userId={typingUser} />
      <MessageInput conversationId={conversationId} />
    </div>
  );
}

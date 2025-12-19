"use client";

import { useState } from "react";
import { useSocketContext } from "@/providers/SocketProvider";

export default function MessageInput({
  conversationId,
}: {
  conversationId: string;
}) {
  const socketRef = useSocketContext();
  const [text, setText] = useState("");

  const sendMessage = () => {
    if (!text.trim()) return;

    socketRef.current.emit("message:send", {
      conversationId,
      content: text,
      type: "text",
    });

    setText("");
  };

  return (
    <div className="flex p-2 border-t">
      <input
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          socketRef.current.emit("typing:start", { conversationId });
        }}
        onBlur={() => socketRef.current.emit("typing:stop", { conversationId })}
        className="flex-1 border rounded px-2"
        placeholder="Type a message"
      />
      <button
        onClick={sendMessage}
        className="ml-2 bg-blue-500 text-white px-4 rounded"
      >
        Send
      </button>
    </div>
  );
}

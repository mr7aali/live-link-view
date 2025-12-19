"use client";

import { SocketProvider } from "@/providers/SocketProvider";
import ChatWindow from "@/components/chat/ChatWindow";

export default function ChatPage() {
  // TEMP: Replace with real auth token
  const token = "YOUR_JWT_TOKEN";
  const conversationId = "YOUR_CONVERSATION_ID";

  return (
    <SocketProvider token={token}>
      <ChatWindow conversationId={conversationId} />
    </SocketProvider>
  );
}

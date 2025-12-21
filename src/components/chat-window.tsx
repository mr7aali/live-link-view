"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@/lib/api";
import { messagesApi } from "@/lib/api";
import { socketService, type MessageReceiveData } from "@/lib/socket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

type ChatWindowProps = {
  token: string;
  user: User;
  currentUserId: string;
  conversationId: string;
  onClose: () => void;
};

type UIMessage = {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt?: string;
};

export function ChatWindow({
  token,
  user,
  currentUserId,
  conversationId,
  onClose,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [text, setText] = useState("");
  const [otherTyping, setOtherTyping] = useState(false);
  const [loading, setLoading] = useState(true);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingTimer = useRef<number | null>(null);
  const typingActive = useRef(false);

  const title = useMemo(() => user.username, [user.username]);

  useEffect(() => {
    let mounted = true;

    async function init() {
      setLoading(true);

      // 1) join room (required for room broadcast)
      await socketService.joinConversation(conversationId);

      // 2) load history (optional)
      const history = await messagesApi.getConversationMessages(
        token,
        conversationId
      );
      if (!mounted) return;

      setMessages(
        history.map((m) => ({
          _id: m._id,
          conversationId: m.conversationId,
          senderId: m.senderId,
          content: m.content,
          createdAt: m.createdAt,
        }))
      );

      setLoading(false);
    }

    init().catch((e) => {
      console.error("[ChatWindow] init error:", e);
      setLoading(false);
    });

    return () => {
      mounted = false;
      socketService.leaveConversation(conversationId);
      socketService.offChatListeners();
    };
  }, [conversationId, token]);

  useEffect(() => {
    socketService.onMessageReceive(async (msg: MessageReceiveData) => {
      if (msg.conversationId !== conversationId) return;

      setMessages((prev) => [
        ...prev,
        {
          _id: msg._id,
          conversationId: msg.conversationId,
          senderId: msg.senderId,
          content: msg.content,
          createdAt: msg.createdAt,
        },
      ]);

      // ✅ mark read if it's from the other user
      if (msg.senderId !== currentUserId) {
        await socketService.markAsRead(conversationId, msg._id);
      }
    });

    socketService.onTypingStart((p) => {
      if (p.conversationId !== conversationId) return;
      if (p.userId === currentUserId) return;
      setOtherTyping(true);
    });

    socketService.onTypingStop((p) => {
      if (p.conversationId !== conversationId) return;
      if (p.userId === currentUserId) return;
      setOtherTyping(false);
    });

    return () => {
      socketService.offChatListeners();
    };
  }, [conversationId, currentUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, otherTyping]);

  const handleTyping = (value: string) => {
    setText(value);

    if (!typingActive.current) {
      socketService.typingStart(conversationId);
      typingActive.current = true;
    }

    if (typingTimer.current) window.clearTimeout(typingTimer.current);

    typingTimer.current = window.setTimeout(() => {
      if (typingActive.current) {
        socketService.typingStop(conversationId);
        typingActive.current = false;
      }
    }, 700);
  };

  const handleSend = async () => {
    const content = text.trim();
    if (!content) return;

    setText("");

    if (typingActive.current) {
      socketService.typingStop(conversationId);
      typingActive.current = false;
    }

    // optimistic UI
    const optimistic: UIMessage = {
      _id: crypto.randomUUID(),
      conversationId,
      senderId: currentUserId,
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((p) => [...p, optimistic]);

    const res = await socketService.sendMessage(
      conversationId,
      content,
      "text"
    );
    if (!res.success) {
      console.error("[ChatWindow] send failed:", res.error);
    }
  };

  return (
    <div className="w-[360px] h-[520px] bg-background border rounded-2xl shadow-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div>
          <p className="font-semibold leading-none">{title}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {otherTyping ? "typing..." : " "}
          </p>
        </div>

        <Button size="icon" variant="ghost" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No messages yet.</p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === currentUserId;
            return (
              <div
                key={m._id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`${
                    mine ? "bg-primary text-primary-foreground" : "bg-muted"
                  } max-w-[78%] rounded-2xl px-3 py-2 text-sm`}
                >
                  {m.content}
                  <div className="text-[10px] opacity-70 mt-1">
                    {m.createdAt
                      ? new Date(m.createdAt).toLocaleTimeString()
                      : ""}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="p-3 border-t flex gap-2">
        <Input
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
        />
        <Button onClick={handleSend}>Send</Button>
      </div>
    </div>
  );
}

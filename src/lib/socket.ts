/* eslint-disable @typescript-eslint/no-explicit-any */
import { io, type Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export type MessageType = "text" | "image" | "audio" | "video" | "file";

// ----------------------
// Calls payloads (your existing)
// ----------------------
export interface CallInitiateData {
  callerId: string;
  offer: RTCSessionDescriptionInit;
  callType: "audio" | "video";
}

export interface CallAnswerData {
  answer: RTCSessionDescriptionInit;
  calleeId: string;
}

export interface IceCandidateData {
  candidate: RTCIceCandidateInit;
  senderId: string;
}

// ----------------------
// Messages payloads (matches backend)
// ----------------------
export interface MessageReceiveData {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
  createdAt?: string;
}

export interface TypingPayload {
  userId: string;
  conversationId: string;
}

export class SocketService {
  private callsSocket: Socket | null = null; // /calls (optional)
  private messagesSocket: Socket | null = null; // /messages (required for chat)

  connect(token: string) {
    // ✅ Always connect messages
    this.connectMessages(token);

    // ✅ Keep calls connect (optional; won’t break chat if backend doesn't have it)
    this.connectCalls(token);

    return {
      messages: this.messagesSocket,
      calls: this.callsSocket,
    };
  }

  private connectMessages(token: string) {
    if (this.messagesSocket?.connected) return this.messagesSocket;

    this.messagesSocket = io(`${SOCKET_URL}/messages`, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    this.messagesSocket.on("connect", () => {
      console.log("[messages] connected", this.messagesSocket?.id);
    });

    this.messagesSocket.on("disconnect", (r) => {
      console.log("[messages] disconnected", r);
    });

    this.messagesSocket.on("connect_error", (e) => {
      console.error("[messages] connect_error", e);
    });

    return this.messagesSocket;
  }

  private connectCalls(token: string) {
    if (this.callsSocket?.connected) return this.callsSocket;

    this.callsSocket = io(`${SOCKET_URL}/calls`, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    this.callsSocket.on("connect", () => {
      console.log("[calls] connected", this.callsSocket?.id);
    });

    this.callsSocket.on("disconnect", (r) => {
      console.log("[calls] disconnected", r);
    });

    this.callsSocket.on("connect_error", (e) => {
      // If you don't have calls gateway, you'll see this — it's okay.
      console.warn(
        "[calls] connect_error (ignore if no calls gateway)",
        e?.message || e
      );
    });

    return this.callsSocket;
  }

  disconnect() {
    if (this.messagesSocket) {
      this.messagesSocket.disconnect();
      this.messagesSocket = null;
    }
    if (this.callsSocket) {
      this.callsSocket.disconnect();
      this.callsSocket = null;
    }
  }

  // ----------------------
  // ✅ Chat (matches your backend)
  // ----------------------
  joinConversation(conversationId: string) {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      this.messagesSocket?.emit(
        "conversation:join",
        { conversationId },
        (res: { success: boolean; error?: string } | undefined) =>
          resolve(res ?? { success: true })
      );
    });
  }

  leaveConversation(conversationId: string) {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      this.messagesSocket?.emit(
        "conversation:leave",
        { conversationId },
        (res: { success: boolean; error?: string } | undefined) =>
          resolve(res ?? { success: true })
      );
    });
  }

  sendMessage(
    conversationId: string,
    content: string,
    type: MessageType = "text"
  ) {
    return new Promise<{ success: boolean; error?: string; message?: any }>(
      (resolve) => {
        this.messagesSocket?.emit(
          "message:send",
          { conversationId, content, type },
          (
            res: { success: boolean; error?: string; message?: any } | undefined
          ) => resolve(res ?? { success: true })
        );
      }
    );
  }

  markAsRead(conversationId: string, messageId: string) {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      this.messagesSocket?.emit(
        "message:read",
        { conversationId, messageId },
        (res: { success: boolean; error?: string } | undefined) =>
          resolve(res ?? { success: true })
      );
    });
  }

  typingStart(conversationId: string) {
    this.messagesSocket?.emit("typing:start", { conversationId });
  }

  typingStop(conversationId: string) {
    this.messagesSocket?.emit("typing:stop", { conversationId });
  }

  onMessageReceive(cb: (data: MessageReceiveData) => void) {
    this.messagesSocket?.on("message:receive", cb);
  }

  onTypingStart(cb: (data: TypingPayload) => void) {
    this.messagesSocket?.on("typing:start", cb);
  }

  onTypingStop(cb: (data: TypingPayload) => void) {
    this.messagesSocket?.on("typing:stop", cb);
  }

  onUserOnline(cb: (data: { userId: string }) => void) {
    this.messagesSocket?.on("user:online", cb);
  }

  onUserOffline(cb: (data: { userId: string }) => void) {
    this.messagesSocket?.on("user:offline", cb);
  }

  offChatListeners() {
    if (!this.messagesSocket) return;
    this.messagesSocket.off("message:receive");
    this.messagesSocket.off("typing:start");
    this.messagesSocket.off("typing:stop");
    this.messagesSocket.off("user:online");
    this.messagesSocket.off("user:offline");
  }

  // ----------------------
  // Calls (your existing)
  // ----------------------
  initiateCall(
    recipientId: string,
    offer: RTCSessionDescriptionInit,
    callType: "audio" | "video"
  ) {
    this.callsSocket?.emit("call:initiate", { recipientId, offer, callType });
  }

  answerCall(callerId: string, answer: RTCSessionDescriptionInit) {
    this.callsSocket?.emit("call:answer", { callerId, answer });
  }

  sendIceCandidate(targetUserId: string, candidate: RTCIceCandidateInit) {
    this.callsSocket?.emit("call:iceCandidate", { targetUserId, candidate });
  }

  rejectCall(callerId: string) {
    this.callsSocket?.emit("call:reject", { callerId });
  }

  endCall(targetUserId: string) {
    this.callsSocket?.emit("call:end", { targetUserId });
  }

  onCallInitiate(callback: (data: CallInitiateData) => void) {
    this.callsSocket?.on("call:initiate", callback);
  }

  onCallAnswer(callback: (data: CallAnswerData) => void) {
    this.callsSocket?.on("call:answer", callback);
  }

  onIceCandidate(callback: (data: IceCandidateData) => void) {
    this.callsSocket?.on("call:iceCandidate", callback);
  }

  onCallReject(callback: (data: { calleeId: string }) => void) {
    this.callsSocket?.on("call:reject", callback);
  }

  onCallEnd(callback: (data: { userId: string }) => void) {
    this.callsSocket?.on("call:end", callback);
  }
}

export const socketService = new SocketService();

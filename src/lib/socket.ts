import { io, type Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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

export interface MessageReceiveData {
  senderId: string;
  message: string;
  timestamp: string;
}

export interface TypingData {
  senderId: string;
  isTyping: boolean;
}

export class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    if (this.socket?.connected) return this.socket;

    this.socket = io(`${SOCKET_URL}/calls`, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    this.socket.on("connect", () => {
      console.log("[v0] WebSocket connected");
    });

    this.socket.on("disconnect", () => {
      console.log("[v0] WebSocket disconnected");
    });

    this.socket.on("connect_error", (error) => {
      console.error("[v0] WebSocket connection error:", error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  // Call event emitters
  initiateCall(
    recipientId: string,
    offer: RTCSessionDescriptionInit,
    callType: "audio" | "video"
  ) {
    this.socket?.emit("call:initiate", { recipientId, offer, callType });
  }

  answerCall(callerId: string, answer: RTCSessionDescriptionInit) {
    this.socket?.emit("call:answer", { callerId, answer });
  }

  sendIceCandidate(targetUserId: string, candidate: RTCIceCandidateInit) {
    this.socket?.emit("call:iceCandidate", { targetUserId, candidate });
  }

  rejectCall(callerId: string) {
    this.socket?.emit("call:reject", { callerId });
  }

  endCall(targetUserId: string) {
    this.socket?.emit("call:end", { targetUserId });
  }

  sendMessage(recipientId: string, message: string) {
    this.socket?.emit("message:send", { recipientId, message });
  }

  sendTypingStatus(recipientId: string, isTyping: boolean) {
    this.socket?.emit("message:typing", { recipientId, isTyping });
  }

  // Call event listeners
  onCallInitiate(callback: (data: CallInitiateData) => void) {
    this.socket?.on("call:initiate", callback);
  }

  onCallAnswer(callback: (data: CallAnswerData) => void) {
    this.socket?.on("call:answer", callback);
  }

  onIceCandidate(callback: (data: IceCandidateData) => void) {
    this.socket?.on("call:iceCandidate", callback);
  }

  onCallReject(callback: (data: { calleeId: string }) => void) {
    this.socket?.on("call:reject", callback);
  }

  onCallEnd(callback: (data: { userId: string }) => void) {
    this.socket?.on("call:end", callback);
  }

  onMessageReceive(callback: (data: MessageReceiveData) => void) {
    this.socket?.on("message:receive", callback);
  }

  onTyping(callback: (data: TypingData) => void) {
    this.socket?.on("message:typing", callback);
  }

  offMessageReceive() {
    this.socket?.off("message:receive");
  }

  offTyping() {
    this.socket?.off("message:typing");
  }
}

export const socketService = new SocketService();

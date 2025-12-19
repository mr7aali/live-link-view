import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (token: string) => {
  if (!socket) {
    socket = io(`${process.env.NEXT_PUBLIC_BACKEND_URL}/messages`, {
      transports: ["websocket"],
      auth: { token },
      autoConnect: false,
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

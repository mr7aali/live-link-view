/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef } from "react";
import { getSocket } from "@/lib/socket";

export const useSocket = (token: string | null) => {
  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (!token) return;

    const socket = getSocket(token);
    socket.connect();
    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [token]);

  return socketRef;
};

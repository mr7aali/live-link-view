// "use client";

// import { createContext, useContext, useEffect } from "react";
// import { useSocket } from "@/hooks/useSocket";
// import type { Socket } from "socket.io-client";

// const SocketContext = createContext<React.MutableRefObject<Socket | null> | null>(null);

// export const SocketProvider = ({
//   children,
//   token,
// }: {
//   children: React.ReactNode;
//   token: string;
// }) => {
//   const socketRef = useSocket(token);

//   useEffect(() => {
//     const socket = socketRef.current;
//     if (!socket) return;

//     socket.on("user:online", ({ userId }: { userId: string }) => {
//       console.log("🟢 User online:", userId);
//     });

//     socket.on("user:offline", ({ userId }: { userId: string }) => {
//       console.log("🔴 User offline:", userId);
//     });

//     return () => {
//       socket.off("user:online");
//       socket.off("user:offline");
//     };
//   }, []);

//   return (
//     <SocketContext.Provider value={socketRef}>
//       {children}
//     </SocketContext.Provider>
//   );
// };

// export const useSocketContext = () => useContext(SocketContext);

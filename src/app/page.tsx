"use client";

import { useEffect, useState } from "react";
import { AuthForm } from "@/components/auth-form";
import { UserList } from "@/components/user-list";
import { CallScreen } from "@/components/call-screen";
import { IncomingCall } from "@/components/incoming-call";
import { ChatWindow } from "@/components/chat-window";
import { Button } from "@/components/ui/button";
import { usersApi, type User } from "@/lib/api";
import { socketService } from "@/lib/socket";
import { useWebRTC } from "@/hooks/use-webrtc";
import { LogOut } from "lucide-react";

export default function HomePage() {
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [activeChatUser, setActiveChatUser] = useState<User | null>(null);

  const {
    isCallActive,
    callType,
    incomingCall,
    localVideoRef,
    remoteVideoRef,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleVideo,
    toggleAudio,
  } = useWebRTC(currentUser?._id || null);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  useEffect(() => {
    if (token) {
      socketService.connect(token);
      fetchProfile();
      fetchUsers();

      return () => {
        socketService.disconnect();
      };
    }
  }, [token]);

  const fetchProfile = async () => {
    if (!token) return;
    try {
      const profile = await usersApi.getProfile(token);
      setCurrentUser(profile);
    } catch (error) {
      console.error("[v0] Failed to fetch profile:", error);
    }
  };

  const fetchUsers = async () => {
    if (!token) return;
    try {
      const allUsers = await usersApi.getAll(token);
      setUsers(allUsers);
    } catch (error) {
      console.error("[v0] Failed to fetch users:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    socketService.disconnect();
    setToken(null);
    setCurrentUser(null);
    setUsers([]);
  };

  const getCallerName = () => {
    if (!incomingCall) return "";
    const caller = users.find((u) => u._id === incomingCall.callerId);
    return caller?.username || "Unknown";
  };

  const handleOpenChat = (user: User) => {
    setActiveChatUser(user);
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <AuthForm onSuccess={setToken} />
      </div>
    );
  }

  if (isCallActive) {
    return (
      <CallScreen
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        callType={callType}
        onEndCall={endCall}
        onToggleVideo={toggleVideo}
        onToggleAudio={toggleAudio}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {incomingCall && (
        <IncomingCall
          callerName={getCallerName()}
          callType={incomingCall.callType}
          onAnswer={answerCall}
          onReject={rejectCall}
        />
      )}

      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">LiveLink</h1>
          <div className="flex items-center gap-4">
            {currentUser && (
              <p className="text-sm text-muted-foreground">
                Welcome, {currentUser.username}
              </p>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <UserList
          users={users}
          currentUserId={currentUser?._id || ""}
          onCall={startCall}
          onMessage={handleOpenChat}
        />
      </main>

      {activeChatUser && (
        <div className="fixed bottom-4 right-4 z-50">
          <ChatWindow
            user={activeChatUser}
            currentUserId={currentUser?._id || ""}
            onClose={() => setActiveChatUser(null)}
          />
        </div>
      )}
    </div>
  );
}

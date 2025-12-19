"use client"

import type { User } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Video, Phone, MessageSquare } from "lucide-react"

interface UserListProps {
  users: User[]
  currentUserId: string
  onCall: (userId: string, type: "audio" | "video") => void
  onMessage: (user: User) => void
}

export function UserList({ users, currentUserId, onCall, onMessage }: UserListProps) {
  const otherUsers = users.filter((u) => u._id !== currentUserId)

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold">Users</h2>
      <div className="flex flex-col gap-2">
        {otherUsers.length === 0 ? (
          <p className="text-muted-foreground text-sm">No other users online</p>
        ) : (
          otherUsers.map((user) => (
            <Card key={user._id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.username}</p>
                    <p className="text-xs text-muted-foreground">{user.status}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => onMessage(user)}>
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onCall(user._id, "audio")}>
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={() => onCall(user._id, "video")}>
                    <Video className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

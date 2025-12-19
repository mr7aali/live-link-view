"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { X, Send } from "lucide-react"
import { socketService } from "@/lib/socket"
import type { User } from "@/lib/api"

interface Message {
  id: string
  senderId: string
  message: string
  timestamp: string
  isSent: boolean
}

interface ChatWindowProps {
  user: User
  currentUserId: string
  onClose: () => void
}

export function ChatWindow({ user, currentUserId, onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const handleMessageReceive = (data: { senderId: string; message: string; timestamp: string }) => {
      if (data.senderId === user._id) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            senderId: data.senderId,
            message: data.message,
            timestamp: data.timestamp,
            isSent: false,
          },
        ])
      }
    }

    const handleTyping = (data: { senderId: string; isTyping: boolean }) => {
      if (data.senderId === user._id) {
        setIsTyping(data.isTyping)
      }
    }

    socketService.onMessageReceive(handleMessageReceive)
    socketService.onTyping(handleTyping)

    return () => {
      socketService.offMessageReceive()
      socketService.offTyping()
    }
  }, [user._id])

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUserId,
      message: inputMessage,
      timestamp: new Date().toISOString(),
      isSent: true,
    }

    setMessages((prev) => [...prev, newMessage])
    socketService.sendMessage(user._id, inputMessage)
    setInputMessage("")
    socketService.sendTypingStatus(user._id, false)
  }

  const handleInputChange = (value: string) => {
    setInputMessage(value)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    if (value.trim()) {
      socketService.sendTypingStatus(user._id, true)
      typingTimeoutRef.current = setTimeout(() => {
        socketService.sendTypingStatus(user._id, false)
      }, 1000)
    } else {
      socketService.sendTypingStatus(user._id, false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{user.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-base">{user.username}</CardTitle>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96 p-4" ref={scrollAreaRef}>
          <div className="flex flex-col gap-3">
            {messages.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">No messages yet. Start the conversation!</p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.isSent ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`rounded-lg px-4 py-2 max-w-[75%] ${
                      msg.isSent ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    <p className="text-sm break-words">{msg.message}</p>
                    <p
                      className={`text-xs mt-1 ${msg.isSent ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))
            )}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <p className="text-sm text-muted-foreground italic">typing...</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="border-t p-3">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={inputMessage}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} size="icon" disabled={!inputMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

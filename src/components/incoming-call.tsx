"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, PhoneOff, Video } from "lucide-react"

interface IncomingCallProps {
  callerName: string
  callType: "audio" | "video"
  onAnswer: () => void
  onReject: () => void
}

export function IncomingCall({ callerName, callType, onAnswer, onReject }: IncomingCallProps) {
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center">Incoming {callType} call</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center">
            {callType === "video" ? (
              <Video className="h-12 w-12 text-primary-foreground" />
            ) : (
              <Phone className="h-12 w-12 text-primary-foreground" />
            )}
          </div>
          <p className="text-xl font-semibold">{callerName}</p>
          <div className="flex gap-4 w-full">
            <Button variant="destructive" className="flex-1" onClick={onReject}>
              <PhoneOff className="h-5 w-5 mr-2" />
              Reject
            </Button>
            <Button className="flex-1" onClick={onAnswer}>
              <Phone className="h-5 w-5 mr-2" />
              Answer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

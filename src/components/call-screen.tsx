"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react"
import { useState } from "react"

interface CallScreenProps {
  localVideoRef: React.RefObject<HTMLVideoElement>
  remoteVideoRef: React.RefObject<HTMLVideoElement>
  callType: "audio" | "video"
  onEndCall: () => void
  onToggleVideo: () => void
  onToggleAudio: () => void
}

export function CallScreen({
  localVideoRef,
  remoteVideoRef,
  callType,
  onEndCall,
  onToggleVideo,
  onToggleAudio,
}: CallScreenProps) {
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(true)

  const handleToggleVideo = () => {
    setVideoEnabled(!videoEnabled)
    onToggleVideo()
  }

  const handleToggleAudio = () => {
    setAudioEnabled(!audioEnabled)
    onToggleAudio()
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="flex-1 relative bg-muted">
        {callType === "video" ? (
          <>
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <Card className="absolute bottom-4 right-4 w-48 h-36 overflow-hidden">
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            </Card>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-primary mx-auto mb-4 flex items-center justify-center">
                <Mic className="h-16 w-16 text-primary-foreground" />
              </div>
              <p className="text-xl font-medium">Audio Call</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 flex justify-center gap-4 bg-card border-t">
        <Button
          size="lg"
          variant={audioEnabled ? "secondary" : "destructive"}
          onClick={handleToggleAudio}
          className="rounded-full h-14 w-14"
        >
          {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </Button>

        {callType === "video" && (
          <Button
            size="lg"
            variant={videoEnabled ? "secondary" : "destructive"}
            onClick={handleToggleVideo}
            className="rounded-full h-14 w-14"
          >
            {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>
        )}

        <Button size="lg" variant="destructive" onClick={onEndCall} className="rounded-full h-14 w-14">
          <PhoneOff className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}

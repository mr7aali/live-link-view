"use client";

import { useEffect, useRef, useState } from "react";
import {
  socketService,
  type CallInitiateData,
  type CallAnswerData,
  type IceCandidateData,
} from "@/lib/socket";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export function useWebRTC(userId: string | null) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [callType, setCallType] = useState<"audio" | "video">("video");
  const [remoteUserId, setRemoteUserId] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallInitiateData | null>(
    null
  );

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const remoteStream = useRef<MediaStream | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    // Listen for incoming calls
    socketService.onCallInitiate((data: CallInitiateData) => {
      console.log("[v0] Incoming call from:", data.callerId);
      setIncomingCall(data);
    });

    socketService.onCallAnswer(async (data: CallAnswerData) => {
      console.log("[v0] Call answered by:", data.calleeId);
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
      }
    });

    socketService.onIceCandidate(async (data: IceCandidateData) => {
      console.log("[v0] ICE candidate received from:", data.senderId);
      if (peerConnection.current && data.candidate) {
        await peerConnection.current.addIceCandidate(
          new RTCIceCandidate(data.candidate)
        );
      }
    });
    const endCall = () => {
      if (remoteUserId) {
        socketService.endCall(remoteUserId);
      }

      if (localStream.current) {
        localStream.current.getTracks().forEach((track) => track.stop());
        localStream.current = null;
      }

      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }

      setIsCallActive(false);
      setRemoteUserId(null);
      setIncomingCall(null);
    };
    socketService.onCallReject((data) => {
      console.log("[v0] Call rejected by:", data.calleeId);
      endCall();
    });

    socketService.onCallEnd((data) => {
      console.log("[v0] Call ended by:", data.userId);
      endCall();
    });

    return () => {
      if (localStream.current) {
        localStream.current.getTracks().forEach((track) => track.stop());
      }
      if (peerConnection.current) {
        peerConnection.current.close();
      }
    };
  }, []);

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && remoteUserId) {
        socketService.sendIceCandidate(remoteUserId, event.candidate.toJSON());
      }
    };

    pc.ontrack = (event) => {
      console.log("[v0] Remote track received");
      remoteStream.current = event.streams[0];
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("[v0] Connection state:", pc.connectionState);
    };

    return pc;
  };

  const startCall = async (targetUserId: string, type: "audio" | "video") => {
    try {
      setCallType(type);
      setRemoteUserId(targetUserId);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === "video",
        audio: true,
      });

      localStream.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      peerConnection.current = createPeerConnection();
      stream.getTracks().forEach((track) => {
        peerConnection.current!.addTrack(track, stream);
      });

      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

      socketService.initiateCall(targetUserId, offer, type);
      setIsCallActive(true);
    } catch (error) {
      console.error("[v0] Error starting call:", error);
      alert("Failed to access camera/microphone");
    }
  };

  const answerCall = async () => {
    if (!incomingCall) return;

    try {
      setCallType(incomingCall.callType);
      setRemoteUserId(incomingCall.callerId);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: incomingCall.callType === "video",
        audio: true,
      });

      localStream.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      peerConnection.current = createPeerConnection();
      stream.getTracks().forEach((track) => {
        peerConnection.current!.addTrack(track, stream);
      });

      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(incomingCall.offer)
      );
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      socketService.answerCall(incomingCall.callerId, answer);
      setIsCallActive(true);
      setIncomingCall(null);
    } catch (error) {
      console.error("[v0] Error answering call:", error);
      alert("Failed to access camera/microphone");
    }
  };

  const rejectCall = () => {
    if (incomingCall) {
      socketService.rejectCall(incomingCall.callerId);
      setIncomingCall(null);
    }
  };

  const endCall = () => {
    if (remoteUserId) {
      socketService.endCall(remoteUserId);
    }

    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop());
      localStream.current = null;
    }

    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    setIsCallActive(false);
    setRemoteUserId(null);
    setIncomingCall(null);
  };

  const toggleVideo = () => {
    if (localStream.current) {
      const videoTrack = localStream.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  };

  const toggleAudio = () => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  };

  return {
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
  };
}

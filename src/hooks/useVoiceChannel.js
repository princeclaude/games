import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000"; // ✅ adjust if deployed

export const useVoiceChannel = () => {
  const [muted, setMuted] = useState(false);
  const [connected, setConnected] = useState(false);

  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);

  useEffect(() => {
    const initVoiceChannel = async () => {
      try {
        // 🎙 1. Request mic access
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        localStreamRef.current = stream;

        // ⿢ Connect socket.io
        socketRef.current = io(SOCKET_URL);

        // ⿣ Create WebRTC PeerConnection
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });
        pcRef.current = pc;

        // Add local audio tracks
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        // Handle remote audio
        pc.ontrack = (event) => {
          const [remoteStream] = event.streams;
          const audioEl = document.createElement("audio");
          audioEl.srcObject = remoteStream;
          audioEl.autoplay = true;
          document.body.appendChild(audioEl);
        };

        // ⿤ Exchange ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socketRef.current.emit("voice-ice-candidate", event.candidate);
          }
        };

        // ⿥ Setup socket listeners
        socketRef.current.on("connect", async () => {
          console.log("✅ Socket connected for voice");
          setConnected(true);

          // Create offer and send to server
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socketRef.current.emit("voice-offer", offer);
        });

        socketRef.current.on("voice-answer", async (answer) => {
          await pc.setRemoteDescription(answer);
        });

        socketRef.current.on("voice-ice-candidate", async (candidate) => {
          try {
            await pc.addIceCandidate(candidate);
          } catch (err) {
            console.error("Error adding ICE candidate", err);
          }
        });
      } catch (err) {
        console.error("🎙 Microphone access denied or error:", err);
      }
    };

    initVoiceChannel();

    return () => {
      // Cleanup
      if (socketRef.current) socketRef.current.disconnect();
      if (pcRef.current) pcRef.current.close();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const toggleMute = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setMuted((prev) => !prev);
  };

  return { muted, toggleMute, connected };
};

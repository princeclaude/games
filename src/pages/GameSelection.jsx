// pages/GameSelection.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import Layout from "../components/Layout";
import { useToast } from "../context/ToastContext";

const SOCKET_URL = import.meta.env.VITE_API_URL || window.location.origin;
const socket = io(SOCKET_URL, { withCredentials: true });

const STUN_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    // add other STUN/TURN servers here if you have them
  ],
};

export default function GameSelection() {
  const { state, search } = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToast();

  // roomId might come via location.state.roomId or ?room= query param
  const qs = new URLSearchParams(search);
  const roomId = state?.roomId || qs.get("room");

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const introAudioRef = useRef(null);
  const containerRef = useRef(null);

  const [isMicOn, setIsMicOn] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [needUserInteraction, setNeedUserInteraction] = useState(false);

  // Throttle scroll emission
  const scrollTimeoutRef = useRef(null);
  const emitScroll = useCallback(
    (scrollTop) => {
      if (!roomId) return;
      // throttle ~50ms
      if (scrollTimeoutRef.current) return;
      scrollTimeoutRef.current = setTimeout(() => {
        socket.emit("scroll", { roomId, scrollTop });
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }, 50);
    },
    [roomId]
  );

  // Start audio + mic + peer connection
  const startMediaAndPeer = useCallback(async () => {
    if (!roomId) {
      console.warn("No roomId; cannot join room or start peer connection.");
      return;
    }

    // 1) join socket room
    socket.emit("join-room", roomId);

    // 2) create/play intro music
    try {
      if (!introAudioRef.current) {
        const a = new Audio("/intro.mp3");
        a.loop = true;
        a.volume = 0.7;
        introAudioRef.current = a;
      }
      await introAudioRef.current.play();
      setIsPlaying(true);
      socket.emit("music-toggle", { roomId, isPlaying: true });
    } catch (err) {
      // autoplay blocked — caller should show UI
      console.warn("Intro autoplay blocked:", err);
      setNeedUserInteraction(true);
    }

    // 3) get mic permission & set up RTCPeerConnection
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      setIsMicOn(true);
      setIsMuted(false);

      // create RTCPeerConnection
      const pc = new RTCPeerConnection(STUN_CONFIG);
      pcRef.current = pc;

      // attach local tracks
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // when receiving remote track, play it
      pc.ontrack = (event) => {
        // create or reuse remote audio element
        if (!remoteAudioRef.current) {
          remoteAudioRef.current = new Audio();
          remoteAudioRef.current.autoplay = true;
        }
        remoteAudioRef.current.srcObject = event.streams[0];
        // attempt to play (may be blocked until user gesture)
        remoteAudioRef.current.play().catch((e) => {
          console.warn("Remote audio play blocked:", e);
        });
      };

      // ICE candidate -> send to server (room-scoped)
      pc.onicecandidate = (ev) => {
        if (ev.candidate) {
          socket.emit("voice-ice-candidate", { roomId, candidate: ev.candidate });
        }
      };

      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("voice-offer", { roomId, offer });
    } catch (err) {
      console.error("Could not start mic or peer:", err);
      addToast("Microphone access required for voice chat.", "error");
      setIsMicOn(false);
    }
  }, [roomId, addToast]);

  // Handler for toggling music (local) and broadcast
  const toggleMusic = async () => {
    if (!introAudioRef.current) return;
    if (isPlaying) {
      introAudioRef.current.pause();
      setIsPlaying(false);
      socket.emit("music-toggle", { roomId, isPlaying: false });
    } else {
      try {
        await introAudioRef.current.play();
        setIsPlaying(true);
        socket.emit("music-toggle", { roomId, isPlaying: true });
      } catch (err) {
        console.warn("Autoplay blocked:", err);
        setNeedUserInteraction(true);
      }
    }
  };

  // Mute/unmute local mic
  const toggleMute = () => {
    if (!localStreamRef.current) return;
    const track = localStreamRef.current.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsMuted(!track.enabled);
    addToast(track.enabled ? "Mic unmuted" : "Mic muted", "info");
  };

  // select game and broadcast
  const handleSelectGame = (game) => {
    setSelectedGame(game);
    if (introAudioRef.current) {
      introAudioRef.current.pause();
      introAudioRef.current.currentTime = 0;
    }
    socket.emit("game-selected", { roomId, game });
    addToast(`You selected ${game}`, "success");
  };

  if (selectedGame === "Snake") {
    navigate(`/snake`, { state: { roomId, game: selectedGame } });
  }

  // If autoplay blocked we show overlay that user must tap to start audio + mic
  const handleUserInteractionToStart = async () => {
    setNeedUserInteraction(false);
    await startMediaAndPeer();
  };

  // Setup socket listeners / signaling
  useEffect(() => {
    if (!roomId) {
      console.warn("No roomId — GameSelection requires a room id to work.");
      return;
    }

    // join immediately (server uses room to broadcast music/game)
    socket.emit("join-room", roomId);

    // music toggle from others
    const onMusicToggle = ({ isPlaying: remotePlaying }) => {
      if (!introAudioRef.current) {
        introAudioRef.current = new Audio("/intro.mp3");
        introAudioRef.current.loop = true;
        introAudioRef.current.volume = 0.7;
      }
      if (remotePlaying) {
        introAudioRef.current.play().catch(() => console.warn("Autoplay blocked (remote music)"));
      } else {
        introAudioRef.current.pause();
      }
      setIsPlaying(Boolean(remotePlaying));
    };

    socket.on("music-toggle", onMusicToggle);

    // game selected by other user
    const onGameSelected = ({ game }) => {
      setSelectedGame(game);
      // stop local audio to sync
      if (introAudioRef.current) {
        introAudioRef.current.pause();
        introAudioRef.current.currentTime = 0;
      }
      addToast(`${game} selected by your partner`, "info");
    };
    socket.on("game-selected", onGameSelected);

    // scroll sync
    const onScroll = ({ scrollTop }) => {
      if (!containerRef.current) return;
      // set remote scroll without triggering emit
      containerRef.current.scrollTop = scrollTop;
    };
    socket.on("scroll", onScroll);

    // Signaling: offer/answer/candidate
    const onVoiceOffer = async ({ offer }) => {
      try {
        console.log("📥 Received voice offer");
        // if no pc, create one
        if (!pcRef.current) {
          const pc = new RTCPeerConnection(STUN_CONFIG);
          pcRef.current = pc;

          // attach local stream if available (request if not)
          if (!localStreamRef.current) {
            try {
              const s = await navigator.mediaDevices.getUserMedia({ audio: true });
              localStreamRef.current = s;
              setIsMicOn(true);
              s.getTracks().forEach((t) => pc.addTrack(t, s));
            } catch (err) {
              console.warn("User denied mic while answering offer:", err);
            }
          } else {
            localStreamRef.current.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current));
          }

          pc.ontrack = (ev) => {
            if (!remoteAudioRef.current) remoteAudioRef.current = new Audio();
            remoteAudioRef.current.srcObject = ev.streams[0];
            remoteAudioRef.current.play().catch(() => console.warn("Autoplay blocked for remote audio"));
          };

          pc.onicecandidate = (ev) => {
            if (ev.candidate) socket.emit("voice-ice-candidate", { roomId, candidate: ev.candidate });
          };
        }

        await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        socket.emit("voice-answer", { roomId, answer });
      } catch (err) {
        console.error("Error handling voice offer:", err);
      }
    };
    socket.on("voice-offer", onVoiceOffer);

    const onVoiceAnswer = async ({ answer }) => {
      try {
        console.log("📥 Received voice answer");
        if (pcRef.current) {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        }
      } catch (err) {
        console.error("Error setting remote answer:", err);
      }
    };
    socket.on("voice-answer", onVoiceAnswer);

    const onVoiceIce = async ({ candidate }) => {
      try {
        if (pcRef.current && candidate) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    };
    socket.on("voice-ice-candidate", onVoiceIce);

    // cleanup on unmount
    return () => {
      socket.off("music-toggle", onMusicToggle);
      socket.off("game-selected", onGameSelected);
      socket.off("scroll", onScroll);
      socket.off("voice-offer", onVoiceOffer);
      socket.off("voice-answer", onVoiceAnswer);
      socket.off("voice-ice-candidate", onVoiceIce);
    };
  }, [roomId, addToast]);

  // attempt to start on mount (will likely be blocked on many browsers)
  useEffect(() => {
    if (!roomId) return;
    startMediaAndPeer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // emit scroll changes
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScrollLocal = () => emitScroll(el.scrollTop);
    el.addEventListener("scroll", onScrollLocal);
    return () => el.removeEventListener("scroll", onScrollLocal);
  }, [emitScroll]);

  // cleanup completely on leave
  useEffect(() => {
    return () => {
      try {
        if (roomId) socket.emit("leave-room", roomId);
      } catch {}
      try {
        localStreamRef.current?.getTracks().forEach((t) => t.stop());
      } catch {}
      try {
        pcRef.current?.close();
      } catch {}
      try {
        introAudioRef.current?.pause();
      } catch {}
    };
  }, [roomId]);

  // UI
  return (
    <Layout>
      <div
        ref={containerRef}
        className="min-h-screen p-6 bg-gradient-to-br from-purple-800 to-black text-white overflow-auto"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <h1 className="text-2xl font-bold mb-4">Pick a Game</h1>

        <p className="text-gray-300 mb-6">
          You are in room: <span className="font-mono">{roomId || "—"}</span>
        </p>

        <div className="grid grid-cols-2 gap-4 max-w-md">
          {["Chess", "Ludo", "Snake", "Puzzle"].map((game) => (
            <button
              key={game}
              onClick={() => handleSelectGame(game)}
              disabled={!!selectedGame}
              className={`py-3 rounded-lg shadow font-semibold transition ${
                selectedGame === game ? "bg-green-600" : "bg-purple-600 hover:bg-purple-700"
              } ${selectedGame && selectedGame !== game ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {game}
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={toggleMute}
            className={`px-4 py-2 rounded-lg font-semibold ${isMuted ? "bg-gray-500" : "bg-red-500"}`}
          >
            {isMuted ? "Unmute Mic" : isMicOn ? "Mute Mic" : "Mic Off"}
          </button>

          <button
            onClick={toggleMusic}
            className={`px-4 py-2 rounded-lg font-semibold ${isPlaying ? "bg-green-600" : "bg-purple-600"}`}
          >
            {isPlaying ? "Pause Music" : "Play Music"}
          </button>

          <div className="ml-auto text-sm text-gray-300">
            {selectedGame ? `Selected: ${selectedGame}` : "No game selected"}
          </div>
        </div>

        {/* floating equalizer */}
        <div className="fixed top-2 right-6 cursor-pointer" onClick={toggleMusic}>
          <div className="flex items-end space-x-1">
            {[1, 2, 3].map((i) => (
              <span
                key={i}
                className={`w-1 rounded ${isPlaying ? "animate-pulse" : "opacity-30"}`}
                style={{ height: `${10 + i * 8}px`, backgroundColor: "#7c3aed" }}
              />
            ))}
          </div>
        </div>

        {/* overlay: shown when autoplay blocked and we need user gesture */}
        {needUserInteraction && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
            onClick={handleUserInteractionToStart}
            role="button"
            aria-label="Enable audio and mic"
          >
            <div className="bg-white/10 p-6 rounded-lg text-center">
              <p className="text-white mb-4 font-semibold">Tap to enable audio & microphone</p>
              <button className="px-4 py-2 bg-purple-600 rounded">Enable</button>
            </div>
          </div>
        )}
      </div>
    </Layout>
);
}
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import Layout from "../components/Layout";
import { useToast } from "../context/ToastContext";

const socket = io(import.meta.env.VITE_API_URL, { withCredentials: true });

const GameSelection = () => {
  const { state } = useLocation();
  const roomId = state?.roomId;

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [introAudio, setIntroAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (!roomId) {
      console.warn("⚠ No roomId provided, skipping join-room");
      return;
    }

    console.log("🟢 Joining room:", roomId);
    socket.emit("join-room", roomId);

    // 🎵 Setup Intro Music
    const audio = new Audio("/intro.mp3");
    audio.loop = true;
    audio.volume = 0.7;
    setIntroAudio(audio);

    const startMicAndMusic = async () => {
      try {
        if (localStorage.getItem("voiceStreamGranted")) {
          // ✅ Corrected check for autoplay flag
          if (localStorage.getItem("autoPlayIntro") === "true") {
            console.log("🎶 Auto-playing intro music...");
            await audio.play();
            setIsPlaying(true);
            socket.emit("music-toggle", { isPlaying: true, roomId });
            localStorage.removeItem("autoPlayIntro");
          }

          // 🎤 Restore microphone stream
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          localStreamRef.current = stream;
          console.log("🎙 Mic stream restored:", stream);

          const pc = new RTCPeerConnection();
          pcRef.current = pc;

          stream.getTracks().forEach((track) => pc.addTrack(track, stream));

          pc.ontrack = (event) => {
            console.log("🔊 Received remote track:", event.streams[0]);
            const remoteAudio = new Audio();
            remoteAudio.srcObject = event.streams[0];
            remoteAudio.play().catch((err) =>
              console.warn("Autoplay blocked for remote audio", err)
            );
          };

          pc.onicecandidate = (event) => {
            if (event.candidate) socket.emit("voice-ice-candidate", event.candidate);
          };

          socket.off("voice-offer").on("voice-offer", async (offer) => {
            console.log("📡 Received voice offer");
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("voice-answer", answer);
          });

          socket.off("voice-answer").on("voice-answer", async (answer) => {
            console.log("📡 Received voice answer");
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
          });

          socket.off("voice-ice-candidate").on("voice-ice-candidate", async (candidate) => {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              console.error("Failed to add ICE candidate", err);
            }
          });

          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("voice-offer", offer);
        } else {
          console.warn("⚠ No mic permission flag found, user must re-enable manually.");
        }
      } catch (err) {
        console.error("Error setting up voice/music:", err);
        addToast("Could not enable voice chat automatically.", "error");
      }
    };

    startMicAndMusic();

    // ✅ Clean up old listeners, then set up new ones
    socket.off("music-toggle").on("music-toggle", ({ isPlaying }) => {
      console.log("🎶 Music state synced:", isPlaying);
      if (isPlaying) {
        audio.play().catch(() => console.warn("Autoplay blocked"));
      } else {
        audio.pause();
      }
      setIsPlaying(isPlaying);
    });

    socket.off("game-selected").on("game-selected", ({ game }) => {
      console.log("🎮 Game synced from peer:", game);
      setSelectedGame(game);
      audio.pause();
      audio.currentTime = 0;
      addToast(`${game} was selected by your partner.`, "info");
    });

    return () => {
      console.log("🔴 Leaving room:", roomId);
      if (roomId) socket.emit("leave-room", roomId);

      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      pcRef.current?.close();

      socket.off("voice-offer");
      socket.off("voice-answer");
      socket.off("voice-ice-candidate");
      socket.off("music-toggle");
      socket.off("game-selected");

      audio.pause();
      addToast("Voice chat ended.", "info");
    };
  }, [roomId]);

  const toggleMute = () => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    setIsMuted(!audioTrack.enabled);
    addToast(audioTrack.enabled ? "🎙 Mic unmuted" : "🔇 Mic muted", "info");
  };

  const toggleIntroMusic = () => {
    if (!introAudio) return;
    if (isPlaying) {
      introAudio.pause();
    } else {
      introAudio.play();
    }
    const newState = !isPlaying;
    setIsPlaying(newState);
    socket.emit("music-toggle", { isPlaying: newState, roomId });
  };

  const handleGameSelect = (game) => {
    if (!roomId) return;
    console.log("🎮 You selected:", game, "sending to room:", roomId);

    setSelectedGame(game);
    if (introAudio) {
      introAudio.pause();
      introAudio.currentTime = 0;
    }
    addToast(`You selected ${game}`, "info");
    socket.emit("game-selected", { game, roomId });
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <h1 className="text-2xl font-bold text-purple-700 mb-2">Pick a Game</h1>

        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          {["Chess", "Ludo", "Snake", "Puzzle"].map((game) => (
            <button
              key={game}
              onClick={() => handleGameSelect(game)}
              disabled={selectedGame !== null}
              className={`py-3 rounded-lg shadow text-white font-semibold transition
                ${
                  selectedGame === game
                    ? "bg-green-600"
                    : "bg-purple-600 hover:bg-purple-700"
                }
                ${
                  selectedGame !== null && selectedGame !== game
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }
              `}
            >
              {game}
            </button>
          ))}
        </div>

        <button
          onClick={toggleMute}
          className={`mt-6 px-6 py-2 rounded-lg text-white font-semibold shadow transition
            ${isMuted ? "bg-gray-500 hover:bg-gray-600" : "bg-red-500 hover:bg-red-600"}
          `}
        >
          {isMuted ? "Unmute Mic" : "Mute Mic"}
        </button>

        {/* Music equalizer toggle */}
        <div
          onClick={toggleIntroMusic}
          className="fixed bottom-6 right-6 cursor-pointer flex space-x-1 items-end"
        >
          {[1, 2, 3].map((bar) => (
            <span
              key={bar}
              className={`w-1 bg-purple-600 rounded ${
                isPlaying ? "animate-pulse" : "opacity-30"
              }`}
              style={{
                height: bar === 1 ? "16px" : bar === 2 ? "24px" : "12px",
                animationDelay: `${bar * 0.1}s`,
              }}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default GameSelection;
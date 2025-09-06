import { useEffect, useRef, useState } from "react";
import { socket } from "../utils/socket";
import { useToast } from "../context/ToastContext";

const GameSelection = ({ roomId }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const { addToast } = useToast();

  // ✅ Setup intro music with autoplay handling
  const startIntroMusic = async () => {
    try {
      const audio = new Audio("/intro.mp3");
      await audio.play();
      setIsPlaying(true);
      socket.emit("music-toggle", { isPlaying: true, roomId });
    } catch (err) {
      console.warn("🎵 Autoplay blocked, waiting for user tap.");
      addToast("Tap anywhere to start the intro music!", "info");

      // Wait for user interaction then try again
      const handleTap = async () => {
        try {
          await audio.play();
          setIsPlaying(true);
          socket.emit("music-toggle", { isPlaying: true, roomId });
        } catch (e) {
          console.error("Still unable to play music:", e);
        }
        document.body.removeEventListener("click", handleTap);
      };
      document.body.addEventListener("click", handleTap, { once: true });
    }
  };

  // ✅ Setup mic + peer connection after room join
  const setupVoiceConnection = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
        }
      };

      // ✅ Gather ICE candidates
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("ice-candidate", { candidate: e.candidate, roomId });
        }
      };

      // ✅ Create offer and send to peer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("offer", { offer, roomId });
    } catch (err) {
      console.error("🎤 Error setting up mic/voice connection:", err);
      addToast(
        "Unable to access microphone. Please allow mic permissions.",
        "error"
      );
    }
  };

  useEffect(() => {
    // ✅ Join room then set up voice
    socket.emit("join-room", roomId, () => {
      console.log("🟢 Joined room confirmed, setting up voice...");
      setupVoiceConnection();
    });

    // ✅ Fix: correct localStorage check
    if (localStorage.getItem("autoPlayIntro") === "true") {
      startIntroMusic();
    }

    // ✅ Socket listeners
    socket.on("answer", async ({ answer }) => {
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(answer);
      }
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      if (pcRef.current) {
        try {
          await pcRef.current.addIceCandidate(candidate);
        } catch (err) {
          console.error("Error adding ICE candidate:", err);
        }
      }
    });

    socket.on("game-selected", ({ game }) => {
      console.log("🎮 Game selected by peer:", game);
      setSelectedGame(game);
    });

    socket.on("music-toggle", ({ isPlaying }) => {
      setIsPlaying(isPlaying);
    });

    return () => {
      // ✅ Clean up on unmount
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("game-selected");
      socket.off("music-toggle");

      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [roomId]);

  const handleSelectGame = (game) => {
    setSelectedGame(game);
    socket.emit("game-selected", { game, roomId });
  };

  return (
    <div className="game-selection">
      <h2>🎮 Select a Game</h2>

      {/* ✅ Remote audio element */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      <button onClick={() => handleSelectGame("Chess")}>Play Chess</button>
      <button onClick={() => handleSelectGame("Checkers")}>
        Play Checkers
      </button>

      <p>Selected Game: {selectedGame || "None"}</p>

      <button onClick={startIntroMusic}>
        {isPlaying ? "Stop Intro Music" : "Play Intro Music"}
      </button>
    </div>
  );
};

export default GameSelection;

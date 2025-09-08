// src/App.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useInvitations } from "./context/InvitationContext";
import { useInviteSocket } from "./hooks/useInviteSocket";
import { ToastProvider, useToast } from "./context/ToastContext";
import Navigation from "./Navigation";
import { socket } from "./utils/socket";

function App() {
  const { fetchInvitations } = useInvitations();

  return (
    <ToastProvider>
      <InviteSocketWrapper fetchInvitations={fetchInvitations} />
      <Navigation />
    </ToastProvider>
  );
}

function InviteSocketWrapper({ fetchInvitations }) {
  // hook that already handles "new-invite" -> refresh invites
  useInviteSocket(fetchInvitations);

  // we also need to register socket and listen global events
  return <SocketRegistrar />;
}

function SocketRegistrar() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    // register user if available
    
    const userStr = localStorage.getItem("user");
    let username = null;
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        username = user?.username;
      } catch (e) {
        console.warn("Invalid user in localStorage");
      }
    }

    // Emit register when socket connects (handles reconnects)
    const onConnect = () => {
      if (username) {
        socket.emit("register", username);
        console.log("Socket registered as:", username);
      }
    };
    socket.on("connect", onConnect);

    // Also run on first mount in case socket already connected
    if (socket.connected && username) {
      socket.emit("register", username);
      console.log("Socket registered (immediate):", username);
    }

    // Listen for invite-accepted -> redirect inviter
    const onInviteAccepted = (payload) => {
      console.log("invite-accepted received (global):", payload);
      const by = payload.by || "Player";
      addToast(`${by} accepted — redirecting you`, "success");

      
      const roomId = payload.roomId || `lobby_${payload.invitationId || payload._id}`;
      const game = payload.gameName || payload.game || (new URLSearchParams(window.location.search).get("game")) || "";

      // small delay so user sees toast
      setTimeout(() => {
        navigate(`/game-selection?game=${encodeURIComponent(game)}`, {
          state: { roomId, autoPlayIntro: true },
        });
      }, 900);
    };
    socket.on("invite-accepted", onInviteAccepted);

    // cleanup
    return () => {
      socket.off("connect", onConnect);
      socket.off("invite-accepted", onInviteAccepted);
      // do NOT call socket.disconnect() here — keep app-level socket live
    };
  }, [addToast, navigate]);

  return null;
}

export default App;
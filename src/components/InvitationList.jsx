// InvitationsList.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import GamepadLoader from "./GamepadLoader";
import { useToast } from "../context/ToastContext";
import { io } from "socket.io-client";

const InvitationsList = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addToast } = useToast();

  // create a single socket instance for this component
  const socketRef = useRef(null);
  if (!socketRef.current) {
    socketRef.current = io(import.meta.env.VITE_API_URL, {
      withCredentials: true,
      transports: ["websocket"],
    });
  }
  const socket = socketRef.current;

  // Fetch invitations
  useEffect(() => {
    let mounted = true;
    const fetchInvitations = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/invite`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();
        if (mounted) {
          if (res.ok) setInvitations(data.data || []);
          else console.error("Failed to fetch invites:", data.message);
        }
      } catch (err) {
        console.error("Error fetching invites:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchInvitations();
    return () => {
      mounted = false;
    };
  }, []);

  // Accept invite
  const handleAccept = async (inviteId, gameName) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/invite/accept`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ invitationId: inviteId }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        // remove or mark invite as accepted locally
        setInvitations((prev) => prev.filter((inv) => inv._id !== inviteId));

        addToast("Invite accepted! Redirecting you to game selection...", "success");

        // use roomId returned from backend (backend now returns roomId)
        const roomId = data.roomId;

        // navigate quickly with state including roomId
        navigate(`/game-selection?game=${encodeURIComponent(gameName)}`, {
          state: { roomId, autoPlayIntro: true },
        });
      } else {
        addToast(`Failed to accept invite: ${data.message}`, "error");
      }
    } catch (err) {
      console.error("Error accepting invite:", err);
      addToast("Error accepting invite", "error");
    }
  };

  // Decline invite
  const handleDecline = async (inviteId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/invite/decline`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ invitationId: inviteId }),
        }
      );

      const data = await res.json();
      if (res.ok) {
        setInvitations((prev) => prev.filter((inv) => inv._id !== inviteId));
        addToast("Invite declined.", "info");
      } else {
        addToast(`Failed to decline invite: ${data.message}`, "error");
      }
    } catch (err) {
      console.error("Error declining invite:", err);
      addToast("❌ Error declining invite", "error");
    }
  };

  // Real-time: listen for invite-accepted and redirect the inviter as well
  useEffect(() => {
    const onInviteAccepted = (payload) => {
      console.log("Invite accepted event received:", payload);
      addToast(`${payload.by} accepted your invite! Redirecting...`, "success");

      // If backend includes roomId in the payload (recommended), use it:
      const navState = payload.roomId ? { state: { roomId: payload.roomId } } : {};
      setTimeout(() => {
        navigate(
          `/game-selection?game=${encodeURIComponent(payload.gameName)}`,
          navState
        );
      }, 1500);
    };

    socket.on("invite-accepted", onInviteAccepted);

    // Also handle invite-declined if you want to show notifier
    const onInviteDeclined = (payload) => {
      addToast(`${payload.by} declined your invite.`, "info");
    };
    socket.on("invite-declined", onInviteDeclined);

    return () => {
      socket.off("invite-accepted", onInviteAccepted);
      socket.off("invite-declined", onInviteDeclined);
      // Do NOT disconnect here if you expect this socket to be reused elsewhere in your app.
      // If this socket is component-scoped and not reused, you can disconnect:
      // socket.disconnect();
    };
  }, [navigate, addToast, socket]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        <GamepadLoader />
      </div>
    );

  if (!invitations.length)
    return <p className="text-center mt-4 text-gray-400">No invites yet</p>;

  return (
    <div className="p-4 space-y-3">
      {invitations.map((invite) => {
        const isExpired = new Date(invite.expiresAt) < new Date();
        const statusLabel = isExpired ? "expired" : invite.status;

        return (
          <div
            key={invite._id}
            className="p-3 rounded-lg shadow-md border border-gray-200 bg-white flex justify-between items-center"
          >
            <div>
              <p className="text-black font-semibold">
                {invite.from} invited you to play{" "}
                <span className="text-purple-600">{invite.gameName}</span>
              </p>
              <p className="text-sm text-gray-500">
                {new Date(invite.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  statusLabel === "pending"
                    ? "bg-purple-100 text-purple-600"
                    : statusLabel === "accepted"
                    ? "bg-green-100 text-green-600"
                    : statusLabel === "declined"
                    ? "bg-red-100 text-red-600"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {statusLabel}
              </span>

              {statusLabel === "pending" && !isExpired && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(invite._id, invite.gameName)}
                    className="px-3 py-1 bg-green-500 text-white rounded-md text-sm hover:bg-green-600"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleDecline(invite._id)}
                    className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600"
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default InvitationsList;
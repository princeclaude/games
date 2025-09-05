import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GamepadLoader from "./GamepadLoader";
import { useToast } from "../context/ToastContext"; 
import { io } from "socket.io-client";

const InvitationsList = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addToast } = useToast();
  const socket = io(import.meta.env.VITE_API_URL);

  // ✅ Fetch invitations on mount
  useEffect(() => {
    const fetchInvitations = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/invite`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (res.ok) {
          setInvitations(data.data);
        } else {
          console.error("Failed to fetch invites:", data.message);
        }
      } catch (err) {
        console.error("Error fetching invites:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvitations();
  }, []);

  // ✅ Accept Invite
  // ✅ Accept Invite (Updated)
  const handleAccept = async (inviteId, gameName) => {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/invite/accept`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ invitationId: inviteId }),
    });

    const data = await res.json();
    if (res.ok) {
      setInvitations((prev) =>
        prev.map((inv) =>
          inv._id === inviteId ? { ...inv, status: "accepted" } : inv
        )
      );

      addToast("Invite accepted! Redirecting you to game selection...", "success");

      // ✅ Grab the roomId from backend response
      const roomId = data.roomId; // Make sure your backend returns this!

      setTimeout(() => {
        navigate(`/game-selection?game=${encodeURIComponent(gameName)}`, {
          state: {
            roomId, // ✅ pass roomId to GameSelection
            autoPlayIntro: true, // ✅ flag to trigger intro music
          },
        });
      }, 1500);
    } else {
      addToast(`Failed to accept invite: ${data.message}`, "error");
    }
  } catch (err) {
    console.error("Error accepting invite:", err);
    addToast("Error accepting invite", "error");
}
};
  // ✅ Decline Invite
  const handleDecline = async (inviteId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/invite/decline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ invitationId: inviteId }),
      });

      const data = await res.json();
      if (res.ok) {
        setInvitations((prev) =>
          prev.map((inv) =>
            inv._id === inviteId ? { ...inv, status: "declined" } : inv
          )
        );

        addToast("Invite declined.", "info");
      } else {
        addToast(`Failed to decline invite: ${data.message}`, "error");
      }
    } catch (err) {
      console.error("Error declining invite:", err);
      addToast("❌ Error declining invite", "error");
    }
  };

  // ✅ Listen for real-time "invite-accepted" event to redirect inviter too
  useEffect(() => {
    socket.on("invite-accepted", (payload) => {
      console.log("🎉 Invite accepted event received:", payload);
      addToast(`${payload.by} accepted your invite! Redirecting...`, "success");

      setTimeout(() => {
        navigate(`/game-selection?game=${encodeURIComponent(payload.gameName)}`);
      }, 3000);
    });

    return () => socket.disconnect();
  }, [navigate]);

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
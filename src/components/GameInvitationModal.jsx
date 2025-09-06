// src/components/GameInviteModal.jsx
import React from "react";

export default function GameInviteModal({ invite, onAccept, onDecline }) {
  if (!invite) return null; // nothing to show if no invite

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-900 text-white p-6 rounded-lg shadow-lg max-w-sm w-full">
        <h2 className="text-xl font-bold mb-3">🎮 Game Invitation</h2>
        <p className="mb-4">
          <span className="font-semibold">{invite.from}</span> invited you to
          play <span className="font-semibold">{invite.gameName}</span>
        </p>

        <div className="flex justify-end gap-4">
          <button
            className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition"
            onClick={onDecline}
          >
            Decline
          </button>
          <button
            className="px-4 py-2 bg-purple-600 rounded hover:bg-purple-500 transition"
            onClick={onAccept}
          >
            Accept
          </button>
        </div>
      </div>

    </div>
  );
}

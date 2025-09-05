import { useEffect } from "react";
import { socket } from "../utils/socket";
import { useToast } from "../context/ToastContext";

export const useInviteSocket = (fetchInvitations) => {
  const {addToast} = useToast();
  useEffect(() => {
    socket.on("new-invite", (invite) => {
      console.log("📩 New invite received:", invite);
      fetchInvitations(); 
      addToast(`${invite.from} invited you to play ${invite.gameName}`, "info");
    });

    return () => {
      socket.off("new-invite");
    };
  }, [fetchInvitations]);
};
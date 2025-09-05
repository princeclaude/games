import { useEffect } from "react";
import { socket } from "../utils/socket";
import { toast } from "react-toastify";

export const useInviteSocket = (fetchInvitations) => {
  useEffect(() => {
    socket.on("new-invite", (invite) => {
      console.log("📩 New invite received:", invite);
      fetchInvitations(); // refresh badge immediately
      toast.info(`${invite.from} invited you to play ${invite.gameName}`);
    });

    return () => {
      socket.off("new-invite");
    };
  }, [fetchInvitations]);
};
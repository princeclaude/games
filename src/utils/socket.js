// utils/socket.js
import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SOCKET_URL  // change to your backend URL in production

// Connect to Socket.IO server
export const socket = io(SERVER_URL, {
  withCredentials: true,
  transports: ["websocket"],
});

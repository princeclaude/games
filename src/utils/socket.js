// utils/socket.js
import { io } from "socket.io-client";

const SERVER_URL = "http://localhost:5000"; // change to your backend URL in production

// Connect to Socket.IO server
export const socket = io(SERVER_URL, {
  withCredentials: true,
  transports: ["websocket"],
});

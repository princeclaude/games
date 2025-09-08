// pages/SnakeGame.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import Layout from "../components/Layout";

const SOCKET_URL = import.meta.env.VITE_API_URL || window.location.origin;
// keep single shared socket (your code used this pattern)
const socket = io(SOCKET_URL, { withCredentials: true });

// MUST match server GRID_SIZE
const GRID_SIZE = 20;

export default function SnakeGame() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const roomId = state?.roomId;
  const me = localStorage.getItem("username") || "You";

  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [players, setPlayers] = useState({}); // players object from server
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [cellSize, setCellSize] = useState(20);
  const [dpr, setDpr] = useState(window.devicePixelRatio || 1);

  // compute canvas size to fit container / view
  useEffect(() => {
    function updateSize() {
      const container = containerRef.current;
      const maxWidth = container ? Math.min(container.clientWidth, 420) : 420;
      const size = Math.floor(maxWidth / GRID_SIZE) * GRID_SIZE; // keep exact multiple
      const cell = Math.max(6, Math.floor(size / GRID_SIZE));
      setCellSize(cell);
      setDpr(window.devicePixelRatio || 1);
      // set canvas real pixel size
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.style.width = `${cell * GRID_SIZE}px`;
        canvas.style.height = `${cell * GRID_SIZE}px`;
        canvas.width = cell * GRID_SIZE * (window.devicePixelRatio || 1);
        canvas.height = cell * GRID_SIZE * (window.devicePixelRatio || 1);
      }
    }

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // draw function
  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const pixelRatio = window.devicePixelRatio || 1;
    const width = canvas.width;
    const height = canvas.height;
    ctx.save();
    ctx.scale(pixelRatio, pixelRatio);

    // clear (use CSS size for drawing coordinate system)
    const cssW = (canvas.width / pixelRatio);
    const cssH = (canvas.height / pixelRatio);
    ctx.clearRect(0, 0, cssW, cssH);

    // background
    ctx.fillStyle = "#0b0b0b";
    ctx.fillRect(0, 0, cssW, cssH);

    // optional grid
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= GRID_SIZE; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize + 0.5, 0);
      ctx.lineTo(x * cellSize + 0.5, cssH);
      ctx.stroke();
    }
    for (let y = 0; y <= GRID_SIZE; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize + 0.5);
      ctx.lineTo(cssW, y * cellSize + 0.5);
      ctx.stroke();
    }

    // draw food
    if (food) {
      ctx.fillStyle = "#ffd166";
      ctx.fillRect(
        food.x * cellSize + 2,
        food.y * cellSize + 2,
        cellSize - 4,
        cellSize - 4
      );
    }

    // draw snakes
    Object.entries(players).forEach(([name, p]) => {
      const color = p.color || "#06d6a0";
      if (!p.snake || !p.snake.length) return;

      // body
      for (let i = 0; i < p.snake.length; i++) {
        const seg = p.snake[i];
        ctx.fillStyle = color;
        // darker for body after head
        if (i > 0) {
          ctx.globalAlpha = 0.95 - Math.min(i * 0.03, 0.5);
        } else {
          ctx.globalAlpha = 1;
        }
        ctx.fillRect(seg.x * cellSize + 1, seg.y * cellSize + 1, cellSize - 2, cellSize - 2);
        ctx.globalAlpha = 1;
      }

      // draw head border to make it distinct
      const head = p.snake[0];
      if (head) {
        ctx.strokeStyle = "#00000055";
        ctx.lineWidth = 1;
        ctx.strokeRect(head.x * cellSize + 1, head.y * cellSize + 1, cellSize - 2, cellSize - 2);
      }
    });

    ctx.restore();
  }, [players, food, cellSize]);

  // keyboard handler - direction only
  const handleKeyDown = (e) => {
    if (!roomId) return;
    const key = e.key;
    let dir;
    if (key === "ArrowUp" || key === "w") dir = "UP";
    if (key === "ArrowDown" || key === "s") dir = "DOWN";
    if (key === "ArrowLeft" || key === "a") dir = "LEFT";
    if (key === "ArrowRight" || key === "d") dir = "RIGHT";
    if (dir) {
      e.preventDefault();
      socket.emit("snake-move", { roomId, username: me, direction: dir });
    }
  };

  // socket listeners lifecycle
  useEffect(() => {
    if (!roomId) {
      navigate("/games");
      return;
    }

    // ensure no duplicate listeners
    socket.off("snake-state");
    socket.off("snake-game-over");

    // join room & snake-join
    socket.emit("join-room", roomId);
    socket.emit("snake-join", { roomId, username: me });

    const onState = ({ players: srvPlayers, food: srvFood }) => {
      setPlayers(srvPlayers || {});
      setFood(srvFood || { x: 5, y: 5 });
      // clear gameOver if new state arrives after restart
      setGameOver(false);
      setWinner(null);
    };

    const onGameOver = ({ winner: srvWinner, players: srvPlayers }) => {
      setGameOver(true);
      setWinner(srvWinner || null);
      // ensure we have final players state for UI
      if (srvPlayers) setPlayers(srvPlayers);
     
    };

    socket.on("snake-state", onState);
    socket.on("snake-game-over", onGameOver);

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      // leave room and remove listeners
      try {
        socket.emit("leave-room", roomId);
      } catch {}
      socket.off("snake-state", onState);
      socket.off("snake-game-over", onGameOver);
      window.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, me, navigate]);

  // redraw on updates
  useEffect(() => {
    drawGame();
  }, [players, food, drawGame]);

  // restart handler (emit to server)
  const handleRestart = () => {
    if (!roomId) return;
    socket.emit("snake-restart", { roomId });
    setGameOver(false);
    setWinner(null);
  };

  // simple mobile controls
  const emitDirection = (dir) => {
    if (!roomId) return;
    socket.emit("snake-move", { roomId, username: me, direction: dir });
  };

  
  const ScoresBar = () => {
    const entries = Object.entries(players);
    if (entries.length === 0) return <div className="text-sm text-gray-300">Waiting for players...</div>;
    // show other player and you
    const other = entries.find(([n]) => n !== me);
    const you = entries.find(([n]) => n === me);
    const otherText =other ? `${other[0]}: ${other[1].score ?? 0}` : "";
    const youText = you ? `You: ${you[1].score ?? 0}` : `You: 0`;
    return (
      <div className="w-full max-w-md flex justify-between items-center px-3 py-2 bg-gray-900/60 rounded">
        <div className="text-sm">{otherText || "Opponent: —"}</div>
        <div className="text-sm font-semibold">{youText}</div>
      </div>
    );
  };

  return (
    <Layout>
      <div ref={containerRef} className="min-h-screen p-6 bg-gradient-to-br from-purple-800 to-black text-white flex flex-col items-center">
        <h1 className="text-xl font-bold mb-2">Snake — Room: <span className="font-mono">{roomId}</span></h1>

        <ScoresBar />

        <div className="mt-4">
          <canvas ref={canvasRef} className="rounded shadow-lg border border-gray-700" />
        </div>

        <div className="mt-4 flex gap-3 items-center">
          {gameOver ? (
            <>
              <div className="text-yellow-300 font-semibold">
                {winner ? `${winner} won!` : "Game Over"}
              </div>
              <button onClick={handleRestart} className="px-4 py-2 bg-green-600 rounded">Play Again</button>
              <button onClick={() => navigate("/games")} className="px-4 py-2 bg-purple-600 rounded">Back to Games</button>
            </>
          ) : (
            <>
              <div className="text-sm text-gray-300">Use arrows or WASD</div>
              <button onClick={() => navigate("/games")} className="px-4 py-2 bg-purple-600 rounded">Exit</button>
            </>
          )}
        </div>

        {/* on-screen controls for mobile */}
        <div className="mt-6 grid grid-cols-3 gap-2 items-center select-none">
          <div />
          <button onClick={() => emitDirection("UP")} className="px-4 py-2 rounded bg-gray-800">↑</button>
          <div />
          <button onClick={() => emitDirection("LEFT")} className="px-4 py-2 rounded bg-gray-800">←</button>
          <button onClick={() => emitDirection("DOWN")} className="px-4 py-2 rounded bg-gray-800">↓</button>
          <button onClick={() => emitDirection("RIGHT")} className="px-4 py-2 rounded bg-gray-800">→</button>
        </div>
      </div>
    </Layout>
);
}
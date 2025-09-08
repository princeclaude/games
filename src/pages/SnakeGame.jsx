// pages/SnakeGame.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import Layout from "../components/Layout";

const SOCKET_URL = import.meta.env.VITE_API_URL || window.location.origin;
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

  const [players, setPlayers] = useState({});
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [cellSize, setCellSize] = useState(20);

  // 🖼 Auto-resize canvas to container
  useEffect(() => {
    function updateSize() {
      const container = containerRef.current;
      const maxWidth = container ? Math.min(container.clientWidth, 420) : 420;
      const size = Math.floor(maxWidth / GRID_SIZE) * GRID_SIZE;
      const cell = Math.max(6, Math.floor(size / GRID_SIZE));
      setCellSize(cell);

      const canvas = canvasRef.current;
      if (canvas) {
        const dpr = window.devicePixelRatio || 1;
        canvas.style.width = `${cell * GRID_SIZE}px`;
        canvas.style.height = `${cell * GRID_SIZE}px`;
        canvas.width = cell * GRID_SIZE * dpr;
        canvas.height = cell * GRID_SIZE * dpr;
      }
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // 🎨 Draw the game
  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.scale(dpr, dpr);

    const cssW = canvas.width / dpr;
    const cssH = canvas.height / dpr;

    // background
    ctx.fillStyle = "#0b0b0b";
    ctx.fillRect(0, 0, cssW, cssH);

    // optional grid
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
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
      if (!p.snake) return;

      p.snake.forEach((seg, i) => {
        ctx.globalAlpha = i === 0 ? 1 : 0.95 - Math.min(i * 0.03, 0.5);
        ctx.fillStyle = color;
        ctx.fillRect(seg.x * cellSize + 1, seg.y * cellSize + 1, cellSize - 2, cellSize - 2);
      });
      ctx.globalAlpha = 1;

      // head border
      const head = p.snake[0];
      if (head) {
        ctx.strokeStyle = "#00000055";
        ctx.lineWidth = 1;
        ctx.strokeRect(head.x * cellSize + 1, head.y * cellSize + 1, cellSize - 2, cellSize - 2);
      }
    });

    ctx.restore();
  }, [players, food, cellSize]);

  // ⌨ Keyboard handler
  const handleKeyDown = (e) => {
    const keys = { ArrowUp: "UP", w: "UP", ArrowDown: "DOWN", s: "DOWN", ArrowLeft: "LEFT", a: "LEFT", ArrowRight: "RIGHT", d: "RIGHT" };
    const dir = keys[e.key];
    if (dir) {
      e.preventDefault();
      socket.emit("snake-move", { roomId, username: me, direction: dir });
    }
  };

  // 🔌 Socket listeners
  useEffect(() => {
    if (!roomId) {
      navigate("/games");
      return;
    }

    socket.off("snake-state");
    socket.off("snake-game-over");

    socket.emit("join-room", roomId);
    socket.emit("snake-join", { roomId, username: me });

    socket.on("snake-state", ({ players: srvPlayers, food: srvFood }) => {
      setPlayers(srvPlayers || {});
      setFood(srvFood || {});
      setGameOver(false);
      setWinner(null);
    });

    socket.on("snake-game-over", ({ winner: srvWinner, players: srvPlayers }) => {
      setGameOver(true);
      setWinner(srvWinner);
      if (srvPlayers) setPlayers(srvPlayers);
    });

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      socket.emit("leave-room", roomId);
      socket.off("snake-state");
      socket.off("snake-game-over");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [roomId, me, navigate]);

  // redraw whenever state changes
  useEffect(() => drawGame(), [drawGame]);

  // restart game
  const handleRestart = () => {
    socket.emit("snake-restart", { roomId });
    setGameOver(false);
    setWinner(null);
  };

  // mobile controls
  const emitDirection = (dir) => {
    socket.emit("snake-move", { roomId, username: me, direction: dir });
  };

  // ✅ Scores bar
  const ScoresBar = () => {
    const entries = Object.entries(players);
    if (entries.length === 0)
      return <div className="text-sm text-gray-300">Waiting for players...</div>;
    const other = entries.find(([n]) => n !== me);
    const you = entries.find(([n]) => n === me);
    return (
      <div className="w-full max-w-md flex justify-between items-center px-3 py-2 bg-gray-900/60 rounded">
        <div className="text-sm">{other ? `${other[0]}: ${other[1].score}` : "Opponent: —"}</div>
        <div className="text-sm font-semibold">{you ? `You: ${you[1].score}` : "You: 0"}</div>
      </div>
    );
  };

  return (
    <Layout>
      <div ref={containerRef} className="min-h-screen p-6 bg-gradient-to-br from-purple-800 to-black text-white flex flex-col items-center">
        <h1 className="text-xl font-bold mb-2">
          Snake — Room: <span className="font-mono">{roomId}</span>
        </h1>

        <ScoresBar />

        <div className="mt-4">
          <canvas ref={canvasRef} className="rounded shadow-lg border border-gray-700" />
        </div>

        <div className="mt-4 flex gap-3 items-center">
          {gameOver ? (
            <>
              <div className="text-yellow-300 font-semibold">
                {winner ? `${winner} won! `: "Game Over"}
              </div>
              <button onClick={handleRestart} className="px-4 py-2 bg-green-600 rounded">Play Again</button>
              <button onClick={() => navigate("/games")} className="px-4 py-2 bg-purple-600 rounded">Back</button>
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
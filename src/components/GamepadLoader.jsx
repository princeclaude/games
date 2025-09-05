// components/GamepadLoader.jsx
const GamepadLoader = () => {
  return (
    <div className="w-24 h-24 relative flex items-center justify-center">
      {/* Gamepad image */}
      <img
        src="/gamepad.png"
        alt="loading gamepad"
        className="w-full h-full object-contain animate-gamepad"
      />

      {/* Buttons overlay (simulate active presses) */}
      <div className="absolute top-1/3 left-1/4 w-3 h-3 bg-red-500 rounded-full animate-blink-red glow"></div>
      <div className="absolute top-1/3 left-1/2 w-3 h-3 bg-yellow-400 rounded-full animate-blink-yellow glow"></div>
      <div className="absolute top-1/3 left-2/3 w-3 h-3 bg-green-400 rounded-full animate-blink-green glow"></div>
    </div>
  );
};

export default GamepadLoader;

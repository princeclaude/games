// components/MiniGamepadToast.jsx
const MiniGamepadToast = () => {
  return (
    <div className="w-10 h-10 relative flex items-center justify-center">
      {/* Gamepad image */}
      <img
        src="/gamepad.png"
        alt="mini gamepad"
        className="w-full h-full object-contain animate-mini-gamepad"
      />

      {/* Buttons overlay */}
      <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-red-500 rounded-full animate-blink-red glow-mini"></div>
      <div className="absolute top-1/3 left-1/2 w-2 h-2 bg-yellow-400 rounded-full animate-blink-yellow glow-mini"></div>
      <div className="absolute top-1/3 left-2/3 w-2 h-2 bg-green-400 rounded-full animate-blink-green glow-mini"></div>
    </div>
  );
};

export default MiniGamepadToast;

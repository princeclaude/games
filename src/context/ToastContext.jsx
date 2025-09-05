
import { createContext, useContext, useState, useCallback } from "react";
import MiniGamepadToast from "../components/MiniGamepadToast";

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const playFeedback = (type) => {
    let soundPath = "";
    let vibrationPattern = 50;

    switch (type) {
      case "success":
        soundPath = "/sounds/success.mp3";
        vibrationPattern = [30, 40, 30];
        break;
      case "error":
        soundPath = "/sounds/error.mp3";
        vibrationPattern = [100, 50, 100];
        break;
      case "info":
        soundPath = "/sounds/info.mp3";
        vibrationPattern = 40;
        break;
      default:
        break;
    }

    if (soundPath) {
      const audio = new Audio(soundPath);
      audio.volume = 0.5;
      audio.play().catch((err) => console.log("Audio play blocked:", err));
    }

    if (/Mobi|Android|iPhone/i.test(navigator.userAgent) && navigator.vibrate) {
      navigator.vibrate(vibrationPattern);
    }
  };

  const addToast = useCallback((message, type = "info", duration = 3000) => {
    const id = Date.now();

    // ✅ Trigger sound + vibration IMMEDIATELY
    playFeedback(type);

    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}

      {/* Toast container */}
      <div className="fixed top-5 right-5 flex flex-col gap-3 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg 
              transform transition-all duration-300
              ${toast.type === "success" ? "bg-purple-700" : ""}
              ${toast.type === "error" ? "bg-red-600" : ""}
              ${toast.type === "info" ? "bg-green-800" : ""}
              animate-slide-in
            `}
          >
            <MiniGamepadToast />
            <p className="text-white font-semibold">{toast.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

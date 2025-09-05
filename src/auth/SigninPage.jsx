import { useState } from "react";
import GamepadLoader from "../components/GamepadLoader";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useToast } from "../context/ToastContext";

const SigninPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { addToast } = useToast();

  const handleSignin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // ✅ Save token to localStorage
        if (data.token) {
          localStorage.setItem("token", data.token);
        }

        // ✅ Optional: Save user info for Dashboard
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }

        addToast(data.message || "Signin successful!", "success");

        setTimeout(() => {
          window.location.href = "/dashboard"; // ✅ fixed typo (was /dasboard)
        }, 1500);
      } else {
        addToast(data.message || "Signin failed!", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center animated-gradient justify-center bg-gradient-to-br from-purple-800 to-black p-6 text-white animate-gradient">
      <h1 className="text-4xl font-bold mb-10 tracking-wide drop-shadow-lg">
        MyGame
      </h1>

      {loading ? (
        <div className="flex flex-col items-center">
          <GamepadLoader />
          <p className="mt-4 text-lg">Signing you in...</p>
        </div>
      ) : (
        <form
          className="flex flex-col w-full max-w-md space-y-4"
          onSubmit={handleSignin}
        >
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="p-3 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-purple-400 hover:rounded-2xl transition-all duration-300 cursor-pointer"
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
                className="w-full p-3 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10 hover:rounded-2xl
              border-purple-950 transition-all duration-300 cursor-pointer"
            />
            <span
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button
            type="submit"
            className="p-3 bg-purple-600 rounded-lg font-bold hover:bg-purple-500 transition transform hover:scale-105"
          >
            Sign In
          </button>
        </form>
      )}

      {!loading && (
        <p className="mt-6 text-gray-300">
          Don't have an account?{" "}
          <a href="/signup" className="text-yellow-400 underline">
            Sign Up
          </a>
        </p>
      )}
    </div>
  );
};

export default SigninPage;

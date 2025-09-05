import { useState } from "react";
import GamepadLoader from "../components/GamepadLoader";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useToast } from "../context/ToastContext";


const SignupPage = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showpassword, setShowpassword] = useState(false);
  const { addToast } = useToast();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        addToast(data.message || "Signup successful!", "success");

        setTimeout(() => {
          window.location.href = "/signin";
        }, 3000);
      } else {
        addToast(data.message || "Signup failed!", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center animated-gradient justify-center bg-gradient-to-br from-purple-800 to-black p-6 text-white">
      <h1 className="text-4xl font-bold mb-10 tracking-wide drop-shadow-lg">
        MyGame
      </h1>

      {loading ? (
        <div className="flex flex-col items-center">
          <GamepadLoader />
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      ) : (
        <form
          className="flex flex-col w-full max-w-md space-y-4"
          onSubmit={handleSignup}
        >
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="p-3 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-purple-400 hover:rounded-2xl transition-all duration-300 cursor-pointer"
          />

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="p-3 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-purple-400 hover:rounded-2xl transition-all duration-300 cursor-pointer"
          />

          <div className="relative">
            <input
              type={showpassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-purple-400 pr-10 hover:rounded-2xl transition-all duration-300 cursor-pointer"
            />
            <span
              className="absolute right-3 top-1/ tranform -translate-y-1/2 text-gray-600 cursor-pointer pt-12"
              onClick={() => setShowpassword(!showpassword)}
            >
              {showpassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          <button
            type="submit"
            className="p-3 bg-purple-600 rounded-lg font-bold hover:bg-purple-500 transition transform hover:scale-105 "
          >
            Sign Up
          </button>
        </form>
      )}

      {!loading && (
        <p className="mt-6 text-gray-300">
          Already have an account?{" "}
          <a href="/signin" className="text-yellow-400 underline">
            Sign In
          </a>
        </p>
      )}
    </div>
  );
};

export default SignupPage;

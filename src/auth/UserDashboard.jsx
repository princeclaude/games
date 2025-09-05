// pages/UserDashboard.jsx
import { useEffect, useState } from "react";
import { FaUser, FaStar } from "react-icons/fa";
import GamepadLoader from "../components/GamepadLoader";
import Layout from "../components/Layout";

const UserDashboard = () => {
  const [user, setUser] = useState(null);
  const [recentPlayers, setRecentPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/me`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        const data = await res.json();
        console.log("response data", data);

        if (res.ok) {
          setUser(data); 
          setRecentPlayers(data?.recentlyPlayed || []);
          localStorage.setItem("user", JSON.stringify(data));
        } else {
          console.error("Failed to fetch user:", data.message);
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center animated-gradient">
        <GamepadLoader />
      </div>
    );
  }

  return (
    <Layout invitationCount={0}>
      {/* Top User Info */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          {user?.profileImage ? (
            <img
              src={user.profileImage}
              alt="Profile"
              className="w-16 h-16 rounded-full border-2 border-purple-400 object-cover"
            />
          ) : (
            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gray-700 border-2 border-purple-400">
              <FaUser className="text-3xl text-gray-300" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold">
              {user?.username?.toUpperCase() || "Player"}
            </h2>
            <div className="flex items-center text-yellow-400">
              <FaStar className="mr-1" /> {user?.star || "Debut"}
            </div>
            <h3
              className={`font-bold ${
                user?.online ? "text-green-500" : "text-red-500"
              }`}
            >
              {user?.online ? "Online" : "Offline"}
            </h3>
          </div>
        </div>
      </div>

      {/* Recently Played Section */}
      <h3 className="text-lg font-semibold mb-3">Recently Played With</h3>
      {recentPlayers.length === 0 ? (
        <p className="text-gray-300 italic">
          You haven't played with anyone yet.
        </p>
      ) : (
        <div className="space-y-3">
          {recentPlayers.map((player, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 bg-gray-800 p-3 rounded-lg hover:bg-gray-700 transition"
            >
              {player.profilePicture ? (
                <img
                  src={player.profilePicture}
                  alt={player.username}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-700">
                  <FaUser className="text-xl text-gray-300" />
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold">{player.username}</p>
                <p className="text-sm text-gray-400">
                  Last played: {player.lastPlayed || "N/A"}
                </p>
              </div>
              <FaStar className="text-yellow-400" />
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default UserDashboard;
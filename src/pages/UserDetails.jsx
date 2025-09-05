// pages/UserDetails.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FaUser } from "react-icons/fa";
import Layout from "../components/Layout";
import GamepadLoader from "../components/GamepadLoader";
import MiniGamepadToast from "../components/MiniGamepadToast";

const UserDetails = () => {
  const { id } = useParams(); // ✅ get user ID from URL
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

 const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/api/user/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (res.ok) {
          setUser(data);
        } else {
          console.error("Failed to fetch user:", data.message);
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen text-white">
          <GamepadLoader />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen text-white">
          User not found.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-purple-800 to-black p-6 text-white">
        {/* Profile Picture */}
        <div className="flex flex-col items-center">
          {user.profileImage ? (
            <img
              src={user.profileImage}
              alt={user.username}
              className="w-24 h-24 rounded-full object-cover border-2 border-purple-400"
            />
          ) : (
            <div className="w-24 h-24 flex items-center justify-center rounded-full bg-gray-700 border-2 border-purple-400">
              <FaUser className="text-3xl text-gray-300" />
            </div>
          )}

          <h1 className="text-2xl font-bold mt-4">{user.username.toUpperCase()}</h1>
          <p className="text-gray-400">{user.email}</p>
        </div>

        {/* Details Section */}
        <div className="mt-6 bg-gray-900 rounded-lg p-4 space-y-3">
          <p><span className="font-semibold">Status:</span> {user.online ? "Online" : "Offline"}</p>
          <p><span className="font-semibold">Star:</span> {user.star}</p>
          <p><span className="font-semibold">Playing:</span> {user.isplaying ? <MiniGamepadToast/> : "Available to play"}</p>
                  <p><span className="font-semibold">Last Login:</span> {new Date(user.lastLogin).toLocaleString()}</p>
          <p><span className="font-semibold">Created:</span> {new Date(user.createdTime).toLocaleString()}</p>
        </div>
      </div>
    </Layout>
  );
};

export default UserDetails;
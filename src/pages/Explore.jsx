// pages/Explore.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser } from "react-icons/fa";
import Layout from "../components/Layout";
import MiniGamepadToast from "../components/MiniGamepadToast";
import GamepadLoader from "../components/GamepadLoader";
import { useToast } from "../context/ToastContext";
import { sendInvite } from "../utils/invite";

const Explore = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch("http://localhost:5000/api/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (res.ok) {
          setUsers(data);
        } else {
          console.error("Failed to fetch users:", data.message);
        }
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

//   const handleInvite = (username) => {
//     addToast(`Invitation sent to ${username}`, "info");
//       };
    
    const handleInvite = async (user) => {
        
  console.log("📤 Sending invite payload:", {
    toUsername: user.username,
    gameName: "FIFA 24",
    type: "friendly-match",
  });

  const result = await sendInvite({
    toUsername: user.username,
    gameName: "FIFA 24",
    type: "friendly-match",
  });

  console.log("Invite result:", result);

  if (result.success) {
    addToast( `Invite sent to ${user.username}`, "info");
  } else {
    addToast(result.data?.message || "Failed to send invite", "error"); }
};

  const goToUserDetails = (userId) => {
    navigate(`/user/${userId}`); 
  };

  if (loading) {
    return (
      <Layout invitationCount={0}>
        <div className="flex items-center justify-center min-h-screen text-white">
          <GamepadLoader />
        </div>
      </Layout>
    );
  }

  return (
    <Layout invitationCount={0}>
      <div className="space-y-3 bg-gradient-to-br from-purple-800 to-black p-4 text-white">
        <h1 className="text-2xl font-bold mb-4">Explore Players</h1>
        {users.length === 0 ? (
          <p>No users found.</p>
        ) : (
          <div className="space-y-3 ">
            {users.map((u) => (
              <div
                key={u._id}
                className="flex items-center justify-between bg-gray-800 p-3 rounded-lg"
              >
                {/* ✅ USER INFO SECTION (clickable) */}
                <div
                  className="flex items-center gap-3 cursor-pointer hover:bg-gray-700 w-12transition-all duration-300 rounded-md"
                  onClick={() => goToUserDetails(u._id)}
                >
                  {u.profileImage ? (
                    <img
                      src={u.profileImage}
                      alt={u.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-700">
                      <FaUser className="text-xl text-gray-300" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{u.username}</p>
                    <p className="font-semibold">{u.star}</p>
                    <p
                      className={`${
                        u.online
                          ? "text-sm text-green-500 font-bold"
                          : "text-sm text-gray-500 font-bold"
                      }`}
                    >
                      {u.online ? "Online" : "Offline"}
                    </p>
                    {u?.isplaying && <MiniGamepadToast />}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="text-sm font-bold ">
                    {u.isplaying ? (
                      <p className="mr-4 animated animate-pulse">
                        {u.username} is playing
                      </p>
                    ) : (
                      <p className="mr-4 font-bold text-green-600">Available</p>
                    )}
                  </div>
                  {!u.isplaying && (
                    <button
                      onClick={() => handleInvite(u)}
                      className="bg-purple-600 mr-4 hover:bg-purple-700 text-white text-sm px-3 py-1 rounded-lg"
                    >
                      Invite
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Explore;

import { NavLink } from "react-router-dom";
import { FaHome, FaBell,FaCompass, FaCog } from "react-icons/fa";

const BottomNav = ({ invitationCount = 0 }) => {
  return (
    <nav className="fixed bottom-0 left-0 w-full bg-gray-900 border-t border-gray-700 flex justify-around items-center py-2 z-50">
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          `flex flex-col items-center text-sm ${
            isActive ? "text-purple-400" : "text-gray-400"
          }`
        }
      >
        <FaHome className="text-lg" />
        <span>Home</span>
      </NavLink>

      <NavLink
        to="/explore"
        className={({ isActive }) =>
          `flex flex-col items-center text-sm ${
            isActive ? "text-purple-400" : "text-gray-400"
          }`
        }
      >
        <FaCompass className="text-lg" />
        <span>Explore</span>
      </NavLink>

      <NavLink
        to="/Expect"
        className={({ isActive }) =>
          `flex flex-col items-center text-sm ${
            isActive ? "text-purple-400" : "text-gray-400"
          }`
        }
      >
        <div className="relative">
          <FaBell className="text-lg" />
          {invitationCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs font-bold rounded-full px-1">
              {invitationCount}
            </span>
          )}
        </div>
        <span>Invitations</span>
      </NavLink>
      
      {/* Settings */}
      <NavLink
        to="/settings"
        className={({ isActive }) =>
          `flex flex-col items-center text-sm ${
            isActive ? "text-purple-400" : "text-gray-400"
          }`
        }
      >
        <FaCog className="text-lg" />
        <span>Settings</span>
      </NavLink>
    </nav>
  );
};

export default BottomNav;

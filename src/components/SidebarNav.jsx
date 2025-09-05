
import { NavLink } from "react-router-dom";
import { FaHome, FaBell, FaCompass, FaCog } from "react-icons/fa";
import { useInvitations } from "../context/InvitationContext";

const SidebarNav = ({ invitationCount = 0 }) => {
    const { invitations } = useInvitations();
  return (
    <aside className="w-60 h-screen bg-gray-900 border-r border-gray-700 flex flex-col p-4">
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          `flex items-center space-x-3 p-3 rounded-md hover:bg-gray-800 ${
            isActive ? "text-purple-400" : "text-gray-300"
          }`
        }
      >
        <FaHome /> <span>Home</span>
          </NavLink>
          
      <NavLink
        to="/explore"
        className={({ isActive }) =>
          `flex items-center space-x-3 p-3 rounded-md hover:bg-gray-800 ${
            isActive ? "text-purple-400" : "text-gray-300"
          }`
        }
      >
        <FaCompass /> <span>Explore</span>
      </NavLink>

      <NavLink
        to="/Expect"
        className={({ isActive }) =>
          `relative flex items-center space-x-3 p-3 rounded-md hover:bg-gray-800 ${
            isActive ? "text-purple-400" : "text-gray-300"
          }`
        }
      >
        <FaBell /> <span>Invitations</span>
        {invitations.length > 0 && (
          <span className="absolute right-3 bg-red-500 text-white text-xs font-bold rounded-full px-2">
            {invitations.length}
          </span>
        )}
      </NavLink>

      <NavLink
        to="/settings"
        className={({ isActive }) =>
          `flex items-center space-x-3 p-3 rounded-md hover:bg-gray-800 ${
            isActive ? "text-purple-400" : "text-gray-300"
          }`
        }
      >
        <FaCog /> <span>Settings</span>
      </NavLink>
    </aside>
  );
};

export default SidebarNav;

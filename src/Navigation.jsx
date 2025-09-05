// src/Navigation.js
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import SigninPage from "./auth/SigninPage";
import SignupPage from "./auth/SignupPage";
import UserDashboard from "./auth/UserDashboard";
import Explore from "./pages/Explore";
import UserDetails from "./pages/UserDetails";
import Expect from "./pages/Expect";
import GameSelection from "./pages/GameSelection";



const Navigation = () => {
  const token = localStorage.getItem("token"); // check if logged in

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/signin" element={<SigninPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected Route */}
        <Route
          path="/dashboard"
          element={token ? <UserDashboard /> : <Navigate to="/signin" />}
        />
        <Route
          path="/explore"
          element={<Explore/>}
        />
        <Route
          path="/user/:id"
          element={<UserDetails/>}
        />
        <Route
          path="/Expect"
          element={<Expect/>}
        />
        <Route
          path="/game-selection"
          element={<GameSelection/>}
        />

        

        {/* Redirect all unknown routes */}
        <Route path="*" element={<Navigate to="/signin" />} />
      </Routes>
    </Router>
  );
};

export default Navigation;

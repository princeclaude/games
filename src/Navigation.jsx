// src/Navigation.js
import { Routes, Route, Navigate } from "react-router-dom";
import SigninPage from "./auth/SigninPage";
import SignupPage from "./auth/SignupPage";
import UserDashboard from "./auth/UserDashboard";
import Explore from "./pages/Explore";
import UserDetails from "./pages/UserDetails";
import Expect from "./pages/Expect";
import GameSelection from "./pages/GameSelection";
import SnakeGame from "./pages/SnakeGame";

const Navigation = () => {
  const token = localStorage.getItem("token"); // check if logged in

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/signin" element={<SigninPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Protected Route */}
      <Route
        path="/dashboard"
        element={token ? <UserDashboard /> : <Navigate to="/signin" />}
      />
      <Route path="/explore" element={<Explore />} />
      <Route path="/user/:id" element={<UserDetails />} />
      <Route path="/expect" element={<Expect />} />
      <Route path="/game-selection" element={<GameSelection />} />
      <Route path="/snake" element={<SnakeGame />} />

      {/* Redirect all unknown routes */}
      <Route path="*" element={<Navigate to="/signin" />} />
    </Routes>
  );
};

export default Navigation;

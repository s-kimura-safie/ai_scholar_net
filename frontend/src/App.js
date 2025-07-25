import Home from "./pages/home/Home";
import Login from "./pages/login/Login";
import Profile from "./pages/profile/Profile";
import Register from "./pages/register/Register";
import UploadPaper from "./pages/upload/UploadPaper";
import Analytics from "./pages/analytics/Analytics";
import LikedPosts from "./pages/liked/LikedPosts";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./states/AuthContext";
import { useContext } from "react";
import { ActiveItemProvider } from './states/ActiveItemContext';

function App() {
  const { user } = useContext(AuthContext);
  return (
    <ActiveItemProvider>
      <Routes>
        <Route path="/" element={user ? <Home /> : <Register />} />
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/upload-paper" element={<UploadPaper />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/liked-posts" element={<LikedPosts />} />
      </Routes>
    </ActiveItemProvider>
  )
}

export default App;

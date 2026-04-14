import { HashRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import Challenges from "./screens/Challenges";
import CoachPanel from "./screens/CoachPanel";
import Home from "./screens/Home";
import Index from "./screens/Index";
import Leaderboard from "./screens/Leaderboard";
import NotFound from "./screens/NotFound";
import Profile from "./screens/Profile";
import Training from "./screens/Training";
import { AppStateProvider } from "./state/appState";

export default function App() {
  return (
    <HashRouter>
      <AppStateProvider>
        <div className="app-shell">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/home" element={<Home />} />
            <Route path="/training" element={<Training />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/coach" element={<CoachPanel />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </AppStateProvider>
    </HashRouter>
  );
}

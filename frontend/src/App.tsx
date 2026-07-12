import { NavLink, Route, HashRouter as Router, Routes } from "react-router-dom";
import { LearnerProvider, useLearner } from "./LearnerContext";
import LearningPipeline from "./pages/LearningPipeline";
import PeerFeed from "./pages/PeerFeed";
import TutorHub from "./pages/TutorHub";

function LearnerSwitcher() {
  const { learnerId, setLearnerId } = useLearner();
  return (
    <select value={learnerId} onChange={(e) => setLearnerId(e.target.value)}>
      {["u_amy", "u_ben", "u_cara", "u_dev", "u_ella"].map((id) => (
        <option key={id} value={id}>
          {id}
        </option>
      ))}
    </select>
  );
}

export default function App() {
  return (
    <LearnerProvider>
      <Router>
        <nav className="top">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            Learn
          </NavLink>
          <NavLink to="/peer" className={({ isActive }) => (isActive ? "active" : "")}>
            Peer Feed
          </NavLink>
          <NavLink to="/tutors" className={({ isActive }) => (isActive ? "active" : "")}>
            Tutor Hub
          </NavLink>
          <div style={{ marginLeft: "auto" }} className="row">
            <span className="muted">learner:</span>
            <LearnerSwitcher />
          </div>
        </nav>
        <Routes>
          <Route path="/" element={<LearningPipeline />} />
          <Route path="/peer" element={<PeerFeed />} />
          <Route path="/tutors" element={<TutorHub />} />
        </Routes>
      </Router>
    </LearnerProvider>
  );
}

import { NavLink, Route, HashRouter as Router, Routes, useLocation } from "react-router-dom";
import { LearnerProvider, useLearner } from "./LearnerContext";
import { ThemeProvider, useTheme } from "./theme";
import { LearnIcon, MapIcon, MoonIcon, PeerIcon, SunIcon, TutorIcon } from "./components/Icons";
import LearningPipeline from "./pages/LearningPipeline";
import MasteryMap from "./pages/MasteryMap";
import PeerFeed from "./pages/PeerFeed";
import TutorHub from "./pages/TutorHub";

const LEARNERS = ["u_amy", "u_ben", "u_cara", "u_dev", "u_ella"];

function LearnerSwitcher() {
  const { learnerId, setLearnerId } = useLearner();
  return (
    <select
      className="learner-select"
      value={learnerId}
      onChange={(e) => setLearnerId(e.target.value)}
      aria-label="Switch learner"
    >
      {LEARNERS.map((id) => (
        <option key={id} value={id}>
          {id.replace("u_", "@")}
        </option>
      ))}
    </select>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button className="icon-btn" onClick={toggle} aria-label="Toggle color theme">
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <div className="page" key={location.pathname}>
      <Routes location={location}>
        <Route path="/" element={<LearningPipeline />} />
        <Route path="/map" element={<MasteryMap />} />
        <Route path="/peer" element={<PeerFeed />} />
        <Route path="/tutors" element={<TutorHub />} />
      </Routes>
    </div>
  );
}

const tabClass = ({ isActive }: { isActive: boolean }) => (isActive ? "tab active" : "tab");

export default function App() {
  return (
    <ThemeProvider>
      <LearnerProvider>
        <Router>
          <div className="app-shell">
            <header className="app-header">
              <div className="brand">
                <span className="brand-dot">
                  <LearnIcon size={15} />
                </span>
                Mentra
              </div>
              <div className="header-actions">
                <LearnerSwitcher />
                <ThemeToggle />
              </div>
            </header>

            <main className="app-main">
              <AnimatedRoutes />
            </main>

            <nav className="tabbar">
              <NavLink to="/" end className={tabClass}>
                <LearnIcon />
                Learn
              </NavLink>
              <NavLink to="/map" className={tabClass}>
                <MapIcon />
                Map
              </NavLink>
              <NavLink to="/peer" className={tabClass}>
                <PeerIcon />
                Peers
              </NavLink>
              <NavLink to="/tutors" className={tabClass}>
                <TutorIcon />
                Tutors
              </NavLink>
            </nav>
          </div>
        </Router>
      </LearnerProvider>
    </ThemeProvider>
  );
}

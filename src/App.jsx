import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import MainMenu from './pages/MainMenu';
import OperatorPanel from './pages/OperatorPanel';
import LiveWindow from './pages/LiveWindow';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/operator" element={<OperatorPanel />} />
        <Route path="/live" element={<LiveWindow />} />
        <Route path="/live/:type" element={<LiveWindow />} />
      </Routes>
    </Router>
  );
}

export default App;

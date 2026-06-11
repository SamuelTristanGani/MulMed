import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import JenisWayang from "./pages/JenisWayang";
import WayangDetail from "./pages/WayangDetail";
import Timeline from "./pages/Timeline";
import Glossary from "./pages/Glossary";
import Quiz from "./pages/Quiz";
import DalangStudio from "./pages/DalangStudio";
import SymbolismExplorer from "./pages/SymbolismExplorer";
import PageEffects from "./components/PageEffects";
import AudioSystem from "./audio/AudioSystem";
import AudioToggle from "./audio/AudioToggle";

// temp
import RigTest from "./pages/RigTest.jsx";

function App() {

  /*
  return (
    
    <BrowserRouter>
      <AudioSystem>
        <PageEffects />
        <AudioToggle />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/jenis" element={<JenisWayang />} />
          <Route path="/jenis/:typeId" element={<WayangDetail />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/glossary" element={<Glossary />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/studio" element={<DalangStudio />} />
          <Route path="/symbolism" element={<SymbolismExplorer />} />
        </Routes>
      </AudioSystem>
    </BrowserRouter>
  );
  */

  // hide after testing
  return (
    <RigTest />
  );
}

export default App;

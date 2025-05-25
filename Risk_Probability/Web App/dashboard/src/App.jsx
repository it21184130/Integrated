import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import FormPage from "./components/FormPage";
import ResultPage from "./components/ResultPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FormPage />} />
        <Route path="/result" element={<ResultPage />} />
      </Routes>
    </Router>
  );
}

export default App;

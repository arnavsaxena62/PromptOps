import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from "@/pages/home"
import ProjectWorkspace from "@/pages/project-workspace"
import RunDetail from "@/pages/run-detail"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/project/:projectId" element={<ProjectWorkspace />} />
        <Route path="/project/:projectId/run/:runId" element={<RunDetail />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

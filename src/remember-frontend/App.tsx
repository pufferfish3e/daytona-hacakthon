"use client";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProjectsProvider } from "./context/ProjectsContext";
import { LandingPage } from "./pages/LandingPage";
import { CreatePage } from "./pages/CreatePage";
import { GeneratedWorkspacePage } from "./pages/GeneratedWorkspacePage";
import { ProjectListPage } from "./pages/ProjectListPage";
import { CompleteMockPage } from "./pages/mocks/CompleteMockPage";

export default function App() {
  return (
    <BrowserRouter>
      <ProjectsProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/create" element={<CreatePage />} />
          <Route path="/create/generated" element={<ProjectListPage />} />
          <Route path="/create/generated/:projectId" element={<GeneratedWorkspacePage />} />
          <Route path="/mocks/complete" element={<CompleteMockPage />} />
        </Routes>
      </ProjectsProvider>
    </BrowserRouter>
  );
}

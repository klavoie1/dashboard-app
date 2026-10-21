import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import LibraryPage from "./pages/LibraryPage";
import Characters from "./pages/Characters.tsx";
import MediaPage from "./pages/MediaPage.tsx";
import Layout from "./components/Layout.tsx";

export default function App() {
  return (
      <BrowserRouter>
        <Routes>
            <Route element={<Layout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/library" element={<LibraryPage />} />
                <Route path="/library/:id" element={<MediaPage />} />
                <Route path="/characters" element={<Characters />} />
            </Route>
        </Routes>
      </BrowserRouter>
  );
}
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import LibraryPage from "./pages/LibraryPage";
import Characters from "./pages/Characters.tsx";
import MediaPage from "./pages/MediaPage.tsx";
import EpisodePage from "./pages/EpisodePage.tsx";
import SettingsPage from "./pages/SettingsPage.tsx";
import SearchPage from "./pages/SearchPage.tsx";
import CharacterPage from "./pages/CharacterPage.tsx";
import DiscoverPage from "./pages/DiscoverPage.tsx";
import JournalPage from "./pages/JournalPage.tsx";
import Layout from "./components/Layout.tsx";

export default function App() {
  return (
      <BrowserRouter>
        <Routes>
            <Route element={<Layout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/library" element={<LibraryPage />} />
                <Route path="/library/:id" element={<MediaPage />} />
                <Route path="/library/:id/episodes/:episode" element={<EpisodePage />} />
                <Route path="/characters" element={<Characters />} />
                <Route path="/characters/:id" element={<CharacterPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/discover" element={<DiscoverPage />} />
                <Route path="/journal" element={<JournalPage />} />
            </Route>
        </Routes>
      </BrowserRouter>
  );
}
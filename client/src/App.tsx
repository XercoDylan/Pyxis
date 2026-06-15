import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import CoursePage from './pages/CoursePage';
import CategoryPage from './pages/CategoryPage';
import FileViewerPage from './pages/FileViewerPage';
import StatsPage from './pages/StatsPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import AccessDeniedPage from './pages/AccessDeniedPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/courses/:courseId" element={<CoursePage />} />
          <Route
            path="/courses/:courseId/categories/:categoryId"
            element={<CategoryPage />}
          />
          <Route path="/files/:fileId" element={<FileViewerPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/access-denied" element={<AccessDeniedPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

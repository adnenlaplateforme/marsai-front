import Navbar from './components/Navbar';
import Login from './components/Login';
import GalleryPage from './pages/GalleryPage';
import HomePage from './pages/HomePage';
import { Routes, Route, Navigate } from 'react-router-dom';
import SubmitMoviePage from './pages/SubmitMoviePage';
import AdminPage from './pages/AdminPage';
import DashboardStats from './components/admin/DashboardStats';
import MoviesManager from './pages/MoviesManager';
import JuryManager from './components/admin/JuryManager';
import LeaderboardManager from './components/admin/LeaderboardManager';
import EventsManager from './components/admin/EventsManager';
import PublicLayout from './components/PublicLayout';
import Newsletter from './components/admin/Newsletter';
import EventsPage from './pages/EventsPage';
import EventBookingPage from './pages/EventBookingPage';
import ProtectedRoute from './components/ProtectedRoute';
import UnsubscribePage from './pages/UnsubscribePage';
import MoviePage from './pages/MoviePage';
import JuryRegisterPage from './pages/JuryRegisterPage';
import EditMoviePage from './pages/EditMoviePage';
import JuryListPage from './pages/JuryListPage';
import JuryPage from './pages/JuryPage';
import JuryMoviesPage from './pages/JuryMoviesPage';
import JuryRatingPage from './pages/JuryRatingPage';

function App() {
  return (
    <div className="typography">
      <Navbar />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/movies" element={<GalleryPage />} />
          <Route path="/movies/:idSlug" element={<MoviePage />} />
          <Route path="/submit" element={<SubmitMoviePage />} />
          <Route path="/submit/:token" element={<EditMoviePage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/invite/:token" element={<JuryRegisterPage />} />
          <Route path="/events/:slug" element={<EventBookingPage />} />
          <Route
            path="/bookings/unsubscribe/:token"
            element={<UnsubscribePage />}
          />
          <Route path="/jury" element={<JuryListPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRole="admin" />}>
          <Route path="/admin" element={<AdminPage />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardStats />} />
            <Route path="movies" element={<MoviesManager />} />
            <Route path="jury" element={<JuryManager />} />
            <Route path="leaderboard" element={<LeaderboardManager />} />
            <Route path="events" element={<EventsManager />} />
            <Route path="newsletter" element={<Newsletter />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRole="jury" />}>
          <Route path="/jury/dashboard" element={<JuryPage />}>
            <Route index element={<Navigate to="movies" replace />} />
            <Route path="movies" element={<JuryMoviesPage />} />
            <Route path="movies/:id/ratings" element={<JuryRatingPage />} />
          </Route>
        </Route>
      </Routes>
    </div>
  );
}

export default App;

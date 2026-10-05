import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import PageTitle from "./component/pageTitle";

import Home from "./pages/Home";
import Services from "./pages/Services";
import AboutUs from "./pages/AboutUs";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Bookings from "./pages/admin/Bookings";
import ServicesAdmin from "./pages/admin/ServicesAdmin";
import GalleryAdmin from "./pages/admin/GalleryAdmin";
import SettingsAdmin from "./pages/admin/SettingsAdmin";

import ProtectedRoute from "./component/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>

      {/* BROWSER TAB TITLE */}

      <PageTitle />

      <Routes>

        {/* =========================
            PUBLIC WEBSITE
        ========================= */}

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/services"
          element={<Services />}
        />

        <Route
          path="/about"
          element={<AboutUs />}
        />

        {/* =========================
            ADMIN LOGIN
        ========================= */}

        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />

        {/* =========================
            ADMIN
        ========================= */}

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >

          <Route
            index
            element={
              <Navigate
                to="dashboard"
                replace
              />
            }
          />

          <Route
            path="dashboard"
            element={<Dashboard />}
          />

          <Route
            path="bookings"
            element={<Bookings />}
          />

          <Route
            path="services"
            element={<ServicesAdmin />}
          />

          <Route
            path="gallery"
            element={<GalleryAdmin />}
          />

          <Route
            path="settings"
            element={<SettingsAdmin />}
          />

        </Route>

      </Routes>

    </BrowserRouter>
  );
}

export default App;
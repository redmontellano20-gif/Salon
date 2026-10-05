import { Routes, Route, Navigate } from "react-router-dom";
import RequireAuth from "./RequireAuth";
import AdminLayout from "./AdminLayout";
import Login from "./AdminLogin";
import Dashboard from "./Dashboard";
import Bookings from "./Bookings";
import ServicesAdmin from "./ServicesAdmin";
import GalleryAdmin from "./GalleryAdmin";
import SettingsAdmin from "./SettingsAdmin";

/* Mounted at /admin/* by App.tsx, so paths here are relative to /admin. */
export default function AdminApp() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route element={<RequireAuth />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="services" element={<ServicesAdmin />} />
          <Route path="gallery" element={<GalleryAdmin />} />
          <Route path="settings" element={<SettingsAdmin />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

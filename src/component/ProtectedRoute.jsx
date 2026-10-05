import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { admin } from "../api/client";

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let active = true;

    const checkAuthentication = async () => {
      try {
        const result = await admin.me();

        if (active) {
          setAuthenticated(result.authenticated === true);
        }
      } catch {
        if (active) {
          setAuthenticated(false);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    checkAuthentication();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Checking admin account...</p>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
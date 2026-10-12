
import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  Navigate,
  useLocation,
} from "react-router-dom";

import { admin } from "../api/client";

type ProtectedRouteProps = {
  children: ReactNode;
};

export default function ProtectedRoute({
  children,
}: ProtectedRouteProps) {
  const location = useLocation();

  const [loading, setLoading] = useState(true);

  const [authenticated, setAuthenticated] =
    useState(false);

  useEffect(() => {
    let active = true;

    const checkAuthentication = async () => {
      const token = localStorage.getItem("admin_token");

      if (!token) {
        if (active) {
          setAuthenticated(false);
          setLoading(false);
        }

        return;
      }

      try {
        const result = await admin.me();

        if (!active) return;

        setAuthenticated(
          result.authenticated === true
        );
      } catch (error) {
        console.error(
          "Admin authentication check failed:",
          error
        );

        if (active) {
          setAuthenticated(false);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void checkAuthentication();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pearl px-5">
        <div className="text-center">
          <div className="mx-auto mb-5 h-9 w-9 animate-spin rounded-full border-2 border-rose/30 border-t-rose-deep" />

          <p className="text-sm text-taupe">
            Checking admin account...
          </p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <Navigate
        to="/admin/login"
        state={{ from: location }}
        replace
      />
    );
  }

  return <>{children}</>;
}
